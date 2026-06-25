import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseMoney } from "@/lib/ledger";

// PATCH /api/charges/[id] -> update a charge (mark paid/waive/edit) (admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();

    let amount: number | undefined;
    if (body.amount !== undefined) {
      const parsed = parseMoney(body.amount);
      if (parsed === null) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      amount = parsed;
    }

    const charge = await db.charge.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(amount !== undefined && { amount }),
        ...(body.kind !== undefined && { kind: body.kind }),
        ...(body.source !== undefined && { source: body.source || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        // Manually flipping status keeps amountPaid in sync so the remaining-
        // balance math stays correct: PAID => fully settled, OPEN => reset.
        ...(body.status !== undefined && {
          status: body.status,
          ...(body.status === "PAID" && { paidDate: new Date() }),
          ...(body.status === "OPEN" && { paidDate: null, amountPaid: 0 }),
          ...(body.status === "WAIVED" && { paidDate: null }),
        }),
      },
    });
    // Reflect a manual "mark paid" in amountPaid (cap to amount).
    if (body.status === "PAID" && charge.amountPaid < charge.amount) {
      await db.charge.update({ where: { id }, data: { amountPaid: charge.amount } });
    }
    return NextResponse.json(charge);
  } catch (error) {
    console.error("Error updating charge:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/charges/[id] (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.charge.delete({ where: { id } });
  return NextResponse.json({ message: "Charge deleted" });
}

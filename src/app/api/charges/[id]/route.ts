import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/charges/[id] -> update a charge (mark paid/waive/edit) (admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  const charge = await db.charge.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.kind !== undefined && { kind: body.kind }),
      ...(body.source !== undefined && { source: body.source || null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.status !== undefined && {
        status: body.status,
        paidDate: body.status === "PAID" ? new Date() : null,
      }),
    },
  });
  return NextResponse.json(charge);
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

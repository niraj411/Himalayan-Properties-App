import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDateOnly, parseOptionalNumber } from "@/lib/utilities";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// PATCH /api/utility-bills/[id] (admin) -> edit any field; only keys present change.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();

  try {
    const data: Record<string, unknown> = {};
    if (body.utilityId !== undefined) {
      const utility = await db.utility.findUnique({ where: { id: String(body.utilityId) } });
      if (!utility) throw new Error("Utility not found");
      data.utilityId = utility.id;
    }
    if (body.periodStart !== undefined) {
      const d = parseDateOnly(body.periodStart);
      if (!d) throw new Error("periodStart is required");
      data.periodStart = d;
    }
    if (body.periodEnd !== undefined) {
      const d = parseDateOnly(body.periodEnd);
      if (!d) throw new Error("periodEnd is required");
      data.periodEnd = d;
    }
    if (body.dueDate !== undefined) data.dueDate = parseDateOnly(body.dueDate);
    if (body.amount !== undefined) {
      const n = parseOptionalNumber(body.amount, "amount");
      if (n === null) throw new Error("amount is required");
      data.amount = n;
    }
    if (body.kwh !== undefined) data.kwh = parseOptionalNumber(body.kwh, "kwh");
    if (body.therms !== undefined) data.therms = parseOptionalNumber(body.therms, "therms");
    if (body.gallons !== undefined) data.gallons = parseOptionalNumber(body.gallons, "gallons");
    if (body.paidAt !== undefined) data.paidAt = parseDateOnly(body.paidAt);
    if (body.paymentMethod !== undefined) {
      data.paymentMethod = body.paymentMethod ? String(body.paymentMethod).toUpperCase() : null;
    }
    if (body.documentUrl !== undefined) data.documentUrl = body.documentUrl || null;
    if (body.externalId !== undefined) data.externalId = body.externalId || null;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const bill = await db.utilityBill.update({
      where: { id },
      data,
      include: {
        utility: {
          select: {
            id: true,
            type: true,
            providerName: true,
            propertyId: true,
            unitId: true,
            accountNumber: true,
            property: { select: { id: true, name: true } },
            unit: { select: { id: true, unitNumber: true } },
          },
        },
      },
    });
    return NextResponse.json(bill);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid bill";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/utility-bills/[id] (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.utilityBill.delete({ where: { id } });
  return NextResponse.json({ message: "Bill deleted" });
}

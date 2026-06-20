import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/utilities/[id] -> update a utility (admin)
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

  const utility = await db.utility.update({
    where: { id },
    data: {
      ...(body.type !== undefined && { type: body.type }),
      ...(body.providerName !== undefined && { providerName: body.providerName }),
      ...(body.unitId !== undefined && { unitId: body.unitId || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.website !== undefined && { website: body.website || null }),
      ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber || null }),
      ...(body.monthlyCost !== undefined && {
        monthlyCost: body.monthlyCost === null || body.monthlyCost === "" ? null : parseFloat(body.monthlyCost),
      }),
      ...(body.dueDay !== undefined && {
        dueDay: body.dueDay === null || body.dueDay === "" ? null : parseInt(body.dueDay, 10),
      }),
      ...(body.tenantNotes !== undefined && { tenantNotes: body.tenantNotes || null }),
      ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes || null }),
      ...(body.tenantVisible !== undefined && { tenantVisible: Boolean(body.tenantVisible) }),
      ...(body.sortOrder !== undefined && {
        sortOrder: body.sortOrder === null || body.sortOrder === "" ? 0 : parseInt(body.sortOrder, 10),
      }),
    },
  });
  return NextResponse.json(utility);
}

// DELETE /api/utilities/[id] (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.utility.delete({ where: { id } });
  return NextResponse.json({ message: "Utility deleted" });
}

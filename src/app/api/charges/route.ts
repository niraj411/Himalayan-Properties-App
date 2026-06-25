import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { openBalance, parseMoney } from "@/lib/ledger";
import { leaseIdsForTenant } from "@/lib/ledger-db";

// GET /api/charges?leaseId=...  -> charges for a lease (admin)
// GET /api/charges?scope=tenant -> the caller's own charges + open balance (tenant)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  // Tenant-facing: identity resolved from the session only; safe fields only.
  if (scope === "tenant") {
    const tenant = await db.tenant.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!tenant) return NextResponse.json({ charges: [], balance: 0 });
    const leaseIds = await leaseIdsForTenant(tenant.id);
    const charges = await db.charge.findMany({
      where: { leaseId: { in: leaseIds } },
      select: { id: true, kind: true, label: true, amount: true, amountPaid: true, dueDate: true, status: true, paidDate: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
    const balance = openBalance(charges);
    return NextResponse.json({ charges, balance });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leaseId = searchParams.get("leaseId") ?? undefined;
  const charges = await db.charge.findMany({
    where: leaseId ? { leaseId } : undefined,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
  return NextResponse.json(charges);
}

// POST /api/charges  -> create a charge (admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  const { leaseId, label, amount, kind, dueDate, source, notes } = data;

  const amt = parseMoney(amount);
  if (!leaseId || !label || amt === null) {
    return NextResponse.json(
      { error: "leaseId, label, and a valid non-negative amount are required" },
      { status: 400 }
    );
  }

  const charge = await db.charge.create({
    data: {
      leaseId,
      label,
      amount: amt,
      kind: kind || "OTHER",
      dueDate: dueDate ? new Date(dueDate) : null,
      source: source || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(charge, { status: 201 });
}

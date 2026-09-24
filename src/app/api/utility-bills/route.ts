import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BILL_SOURCES,
  parseDateOnly,
  parseOptionalNumber,
} from "@/lib/utilities";

// Utility bills are ADMIN-ONLY. There is deliberately no tenant scope on this
// route: bill amounts, usage and statements never reach the tenant portal.

const BILL_INCLUDE = {
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
} as const;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// GET /api/utility-bills?propertyId=..&utilityId=..&year=..&unpaid=1
export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const utilityId = searchParams.get("utilityId");
  const year = searchParams.get("year");
  const unpaid = searchParams.get("unpaid");

  const where: Record<string, unknown> = {};
  if (utilityId) where.utilityId = utilityId;
  if (propertyId) where.utility = { propertyId };
  if (unpaid) where.paidAt = null;
  if (year && /^\d{4}$/.test(year)) {
    where.periodEnd = {
      gte: new Date(Date.UTC(+year, 0, 1)),
      lt: new Date(Date.UTC(+year + 1, 0, 1)),
    };
  }

  const bills = await db.utilityBill.findMany({
    where,
    include: BILL_INCLUDE,
    orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(bills);
}

// POST /api/utility-bills -> log a bill. Same (utility, period) re-posted updates
// the existing row instead of duplicating it.
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();

  try {
    const utilityId = String(data.utilityId || "");
    if (!utilityId) throw new Error("utilityId is required");
    const utility = await db.utility.findUnique({ where: { id: utilityId } });
    if (!utility) throw new Error("Utility not found");

    const periodStart = parseDateOnly(data.periodStart);
    const periodEnd = parseDateOnly(data.periodEnd);
    if (!periodStart || !periodEnd) throw new Error("periodStart and periodEnd are required");
    if (periodEnd < periodStart) throw new Error("periodEnd must be on or after periodStart");
    const amount = parseOptionalNumber(data.amount, "amount");
    if (amount === null) throw new Error("amount is required");

    const source = BILL_SOURCES.includes(data.source) ? data.source : "MANUAL";
    const fields = {
      dueDate: parseDateOnly(data.dueDate),
      amount,
      kwh: parseOptionalNumber(data.kwh, "kwh"),
      therms: parseOptionalNumber(data.therms, "therms"),
      gallons: parseOptionalNumber(data.gallons, "gallons"),
      paidAt: parseDateOnly(data.paidAt),
      paymentMethod: data.paymentMethod ? String(data.paymentMethod).toUpperCase() : null,
      documentUrl: data.documentUrl ? String(data.documentUrl) : null,
      externalId: data.externalId ? String(data.externalId) : null,
      notes: data.notes ? String(data.notes) : null,
    };

    const bill = await db.utilityBill.upsert({
      where: { utilityId_periodStart_periodEnd: { utilityId, periodStart, periodEnd } },
      create: { utilityId, periodStart, periodEnd, source, ...fields },
      update: { source, ...fields },
      include: BILL_INCLUDE,
    });
    return NextResponse.json(bill, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid bill";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

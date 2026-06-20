import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { TENANT_UTILITY_SELECT } from "@/lib/utilities";

const ORDER = [{ sortOrder: "asc" as const }, { type: "asc" as const }];

// GET /api/utilities?propertyId=...   -> full utilities for a property (admin)
// GET /api/utilities?scope=tenant     -> tenant-safe utilities for the caller's property
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const propertyId = searchParams.get("propertyId");

  // Tenant-facing: only tenant-visible fields, property-wide + this unit's overrides.
  if (scope === "tenant") {
    const tenant = await db.tenant.findUnique({
      where: { userId: session.user.id },
      include: { unit: true },
    });
    if (!tenant?.unit) return NextResponse.json([]);
    const utilities = await db.utility.findMany({
      where: {
        propertyId: tenant.unit.propertyId,
        tenantVisible: true,
        OR: [{ unitId: null }, { unitId: tenant.unitId }],
      },
      select: TENANT_UTILITY_SELECT,
      orderBy: ORDER,
    });
    return NextResponse.json(utilities);
  }

  // Admin: full records for a property.
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId or scope=tenant required" }, { status: 400 });
  }
  const utilities = await db.utility.findMany({
    where: { propertyId },
    orderBy: ORDER,
  });
  return NextResponse.json(utilities);
}

// POST /api/utilities  -> create a utility (admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await request.json();
  const { propertyId, unitId, type, providerName } = data;
  if (!propertyId || !type || !providerName) {
    return NextResponse.json({ error: "propertyId, type and providerName are required" }, { status: 400 });
  }

  const utility = await db.utility.create({
    data: {
      propertyId,
      unitId: unitId || null,
      type,
      providerName,
      phone: data.phone || null,
      website: data.website || null,
      accountNumber: data.accountNumber || null,
      monthlyCost:
        data.monthlyCost === undefined || data.monthlyCost === null || data.monthlyCost === ""
          ? null
          : parseFloat(data.monthlyCost),
      dueDay:
        data.dueDay === undefined || data.dueDay === null || data.dueDay === ""
          ? null
          : parseInt(data.dueDay, 10),
      tenantNotes: data.tenantNotes || null,
      internalNotes: data.internalNotes || null,
      tenantVisible: data.tenantVisible === undefined ? true : Boolean(data.tenantVisible),
      sortOrder:
        data.sortOrder === undefined || data.sortOrder === null || data.sortOrder === ""
          ? 0
          : parseInt(data.sortOrder, 10),
    },
  });
  return NextResponse.json(utility, { status: 201 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leases = await db.lease.findMany({
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
        payments: { orderBy: { date: "desc" }, take: 5 },
        escalations: { orderBy: { effectiveDate: "asc" } },
        insurance: { orderBy: { expirationDate: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leases);
  } catch (error) {
    console.error("Error fetching leases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { tenantId, unitId, startDate, endDate, monthlyRent, depositAmount, documentUrl, notes, leaseType } = data;

    if (!tenantId || !unitId || !startDate || !endDate || !monthlyRent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Expire any existing active leases for this unit
    await db.lease.updateMany({
      where: { unitId, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });

    const lease = await db.lease.create({
      data: {
        tenantId,
        unitId,
        leaseType: leaseType || "RESIDENTIAL",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent: parseFloat(monthlyRent),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        documentUrl,
        notes,
        status: "ACTIVE",
      },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
        escalations: true,
        insurance: true,
      },
    });

    // Update tenant's unit assignment
    await db.tenant.update({
      where: { id: tenantId },
      data: { unitId, moveInDate: new Date(startDate) },
    });

    // Update unit status
    await db.unit.update({
      where: { id: unitId },
      data: { status: "OCCUPIED" },
    });

    return NextResponse.json(lease, { status: 201 });
  } catch (error) {
    console.error("Error creating lease:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

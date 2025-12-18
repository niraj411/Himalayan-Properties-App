import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        user: true,
        unit: { include: { property: true } },
        leases: { orderBy: { createdAt: "desc" } },
        maintenanceRequests: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { name, email, phone, unitId, emergencyContact, emergencyPhone } = data;

    const tenant = await db.tenant.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Update user info
    await db.user.update({
      where: { id: tenant.userId },
      data: { name, email, phone },
    });

    // Handle unit changes
    const oldUnitId = tenant.unitId;
    if (oldUnitId !== unitId) {
      // Free up old unit
      if (oldUnitId) {
        await db.unit.update({
          where: { id: oldUnitId },
          data: { status: "VACANT" },
        });
      }
      // Occupy new unit
      if (unitId) {
        await db.unit.update({
          where: { id: unitId },
          data: { status: "OCCUPIED" },
        });
      }
    }

    // Update tenant
    const updatedTenant = await db.tenant.update({
      where: { id },
      data: {
        unitId: unitId || null,
        emergencyContact,
        emergencyPhone,
      },
      include: {
        user: true,
        unit: { include: { property: true } },
      },
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Free up unit
    if (tenant.unitId) {
      await db.unit.update({
        where: { id: tenant.unitId },
        data: { status: "VACANT" },
      });
    }

    // Delete tenant (user remains)
    await db.tenant.delete({ where: { id } });

    return NextResponse.json({ message: "Tenant deleted" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

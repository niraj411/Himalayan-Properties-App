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
    const lease = await db.lease.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
        payments: { orderBy: { date: "desc" } },
        escalations: { orderBy: { effectiveDate: "asc" } },
        insurance: { orderBy: { expirationDate: "asc" } },
      },
    });

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error("Error fetching lease:", error);
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
    const { startDate, endDate, monthlyRent, depositAmount, documentUrl, notes, status, leaseType } = data;

    const lease = await db.lease.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        documentUrl,
        notes,
        status,
        leaseType,
      },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
        escalations: { orderBy: { effectiveDate: "asc" } },
        insurance: { orderBy: { expirationDate: "asc" } },
      },
    });

    return NextResponse.json(lease);
  } catch (error) {
    console.error("Error updating lease:", error);
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
    await db.lease.delete({ where: { id } });

    return NextResponse.json({ message: "Lease deleted" });
  } catch (error) {
    console.error("Error deleting lease:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

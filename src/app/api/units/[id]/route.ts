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
    const unit = await db.unit.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: {
          include: { user: true },
        },
        leases: {
          orderBy: { createdAt: "desc" },
        },
        maintenanceRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
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
    const { unitNumber, bedrooms, bathrooms, sqft, rent, status } = data;

    const unit = await db.unit.update({
      where: { id },
      data: {
        unitNumber,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        sqft: sqft || null,
        rent: rent !== undefined ? parseFloat(rent) : undefined,
        status,
      },
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error updating unit:", error);
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
    await db.unit.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Unit deleted" });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

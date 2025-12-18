import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

    const units = await db.unit.findMany({
      where,
      include: {
        property: true,
        tenant: {
          include: { user: true },
        },
      },
      orderBy: { unitNumber: "asc" },
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
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
    const { propertyId, unitNumber, bedrooms, bathrooms, sqft, rent, status } = data;

    if (!propertyId || !unitNumber || rent === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const unit = await db.unit.create({
      data: {
        propertyId,
        unitNumber,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        sqft: sqft || null,
        rent: parseFloat(rent),
        status: status || "VACANT",
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

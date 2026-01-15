import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get("leaseId");

    const where = leaseId ? { leaseId } : {};

    const escalations = await db.leaseEscalation.findMany({
      where,
      include: {
        lease: {
          include: {
            tenant: {
              include: {
                user: true,
              },
            },
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
      orderBy: { effectiveDate: "asc" },
    });

    return NextResponse.json(escalations);
  } catch (error) {
    console.error("Error fetching escalations:", error);
    return NextResponse.json(
      { error: "Failed to fetch escalations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      leaseId,
      effectiveDate,
      newMonthlyRent,
      increaseType,
      increaseValue,
      notes,
    } = body;

    if (!leaseId || !effectiveDate || !newMonthlyRent || !increaseType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const escalation = await db.leaseEscalation.create({
      data: {
        leaseId,
        effectiveDate: new Date(effectiveDate),
        newMonthlyRent: parseFloat(newMonthlyRent),
        increaseType,
        increaseValue: increaseValue ? parseFloat(increaseValue) : null,
        notes,
      },
    });

    return NextResponse.json(escalation, { status: 201 });
  } catch (error) {
    console.error("Error creating escalation:", error);
    return NextResponse.json(
      { error: "Failed to create escalation" },
      { status: 500 }
    );
  }
}

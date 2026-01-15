import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get("leaseId");
    const expiringSoon = searchParams.get("expiringSoon");

    let where: Record<string, unknown> = {};

    if (leaseId) {
      where.leaseId = leaseId;
    }

    // For admin, show all or filtered by lease
    // For tenant, only show their own insurance records
    if (session.user.role !== "ADMIN") {
      const tenant = await db.tenant.findUnique({
        where: { userId: session.user.id },
        include: { leases: true },
      });
      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }
      where.leaseId = { in: tenant.leases.map((l) => l.id) };
    }

    // Filter for expiring soon (within 30 days)
    if (expiringSoon === "true") {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expirationDate = { lte: thirtyDaysFromNow };
    }

    const insurance = await db.insuranceRecord.findMany({
      where,
      include: {
        lease: {
          include: {
            tenant: { include: { user: true } },
            unit: { include: { property: true } },
          },
        },
      },
      orderBy: { expirationDate: "asc" },
    });

    return NextResponse.json(insurance);
  } catch (error) {
    console.error("Error fetching insurance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch insurance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      leaseId,
      insuranceType,
      carrier,
      policyNumber,
      coverageAmount,
      effectiveDate,
      expirationDate,
      documentUrl,
    } = body;

    if (!leaseId || !effectiveDate || !expirationDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the user has access to this lease
    if (session.user.role !== "ADMIN") {
      const tenant = await db.tenant.findUnique({
        where: { userId: session.user.id },
        include: { leases: true },
      });
      if (!tenant || !tenant.leases.some((l) => l.id === leaseId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const insurance = await db.insuranceRecord.create({
      data: {
        leaseId,
        insuranceType: insuranceType || "LIABILITY",
        carrier,
        policyNumber,
        coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null,
        effectiveDate: new Date(effectiveDate),
        expirationDate: new Date(expirationDate),
        documentUrl,
        beneficiaryName: "Himalayan Holdings Property LLC",
      },
    });

    return NextResponse.json(insurance, { status: 201 });
  } catch (error) {
    console.error("Error creating insurance record:", error);
    return NextResponse.json(
      { error: "Failed to create insurance record" },
      { status: 500 }
    );
  }
}

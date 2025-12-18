import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get("leaseId");

    const where: Record<string, unknown> = {};
    if (leaseId) where.leaseId = leaseId;

    // If tenant, only show their payments
    if (session.user.role === "TENANT" && session.user.tenantId) {
      const leases = await db.lease.findMany({
        where: { tenantId: session.user.tenantId },
        select: { id: true },
      });
      where.leaseId = { in: leases.map(l => l.id) };
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        lease: {
          include: {
            tenant: { include: { user: true } },
            unit: { include: { property: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
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
    const { leaseId, amount, date, method, reference, notes } = data;

    if (!leaseId || !amount || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        leaseId,
        amount: parseFloat(amount),
        date: new Date(date),
        method,
        reference,
        notes,
      },
      include: {
        lease: {
          include: {
            tenant: { include: { user: true } },
            unit: { include: { property: true } },
          },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

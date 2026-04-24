import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const properties = await db.property.findMany({
      include: {
        units: {
          include: {
            tenants: { include: { user: true } },
            leases: {
              where: { status: "ACTIVE" },
              take: 1,
            },
          },
          orderBy: { unitNumber: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Fetch all payments made this month across all leases
    const paymentsThisMonth = await db.payment.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { lease: true },
    });

    const paymentsByLease = new Map<string, { total: number; lastDate: Date | null }>();
    for (const p of paymentsThisMonth) {
      const existing = paymentsByLease.get(p.leaseId);
      if (!existing) {
        paymentsByLease.set(p.leaseId, { total: p.amount, lastDate: p.date });
      } else {
        paymentsByLease.set(p.leaseId, {
          total: existing.total + p.amount,
          lastDate: existing.lastDate && existing.lastDate > p.date ? existing.lastDate : p.date,
        });
      }
    }

    let totalExpected = 0;
    let totalCollected = 0;
    let totalMortgage = 0;

    const propertyData = properties.map((property) => {
      const mortgage = property.mortgageMonthlyPayment || 0;
      totalMortgage += mortgage;

      let propertyExpected = 0;
      let propertyCollected = 0;

      const unitData = property.units.map((unit) => {
        const activeLease = unit.leases[0] || null;
        const rent = activeLease?.monthlyRent ?? unit.rent;
        const leasePayment = activeLease ? paymentsByLease.get(activeLease.id) : null;
        const paidThisMonth = leasePayment ? leasePayment.total >= rent * 0.9 : false;

        if (unit.status === "OCCUPIED" && activeLease) {
          propertyExpected += rent;
          propertyCollected += leasePayment?.total || 0;
        }

        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          status: unit.status,
          rent,
          tenantName: unit.tenants.map((t) => t.user.name).join(", ") || null,
          leaseId: activeLease?.id || null,
          paidThisMonth,
          paidAmount: leasePayment?.total || 0,
          lastPaymentDate: leasePayment?.lastDate || null,
        };
      });

      totalExpected += propertyExpected;
      totalCollected += propertyCollected;

      return {
        id: property.id,
        name: property.name,
        type: property.type,
        address: property.address,
        city: property.city,
        state: property.state,
        totalUnits: property.units.length,
        occupiedUnits: property.units.filter((u) => u.status === "OCCUPIED").length,
        expectedRent: propertyExpected,
        collectedRent: propertyCollected,
        variance: propertyCollected - propertyExpected,
        mortgageLender: property.mortgageLender,
        mortgageMonthlyPayment: mortgage,
        mortgageDueDay: property.mortgageDueDay,
        mortgageBalance: property.mortgageBalance,
        netIncome: propertyCollected - mortgage,
        units: unitData,
      };
    });

    return NextResponse.json({
      month: now.toISOString(),
      summary: {
        totalExpected,
        totalCollected,
        totalMortgage,
        netIncome: totalCollected - totalMortgage,
      },
      properties: propertyData,
    });
  } catch (error) {
    console.error("Error fetching rent roll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

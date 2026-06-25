import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isConnected, createPaymentReceipt } from "@/lib/quickbooks";
import { sendTenantEmail } from "@/lib/email";
import { parseMoney } from "@/lib/ledger";
import { allocatePaymentToCharge, leaseIdsForTenant } from "@/lib/ledger-db";

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

    // If tenant, only ever show their own payments. Fail closed: a tenant with
    // no linked tenant record sees nothing, never the full unscoped list.
    if (session.user.role === "TENANT") {
      if (!session.user.tenantId) {
        return NextResponse.json([]);
      }
      where.leaseId = { in: await leaseIdsForTenant(session.user.tenantId) };
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
    const { leaseId, amount, date, method, reference, notes, syncToQuickBooks, chargeId } = data;

    const amt = parseMoney(amount);
    if (!leaseId || amt === null || amt <= 0 || !date) {
      return NextResponse.json(
        { error: "leaseId, a positive amount, and date are required" },
        { status: 400 }
      );
    }

    // Create the payment and, if it's allocated to a charge, settle that charge
    // atomically so the two never drift out of sync.
    const payment = await db.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          leaseId,
          chargeId: chargeId || null,
          amount: amt,
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
      if (chargeId) {
        await allocatePaymentToCharge(tx, chargeId, leaseId, amt);
      }
      return created;
    });

    // Sync to QuickBooks if requested and connected
    let qbSynced = false;
    if (syncToQuickBooks) {
      const qbConnected = await isConnected();
      if (qbConnected) {
        try {
          const tenantName = payment.lease.tenant.user.name;
          const unitInfo = `${payment.lease.unit.property.name} - Unit ${payment.lease.unit.unitNumber}`;
          await createPaymentReceipt({
            tenantName,
            amount: payment.amount,
            date: new Date(date).toISOString().split("T")[0],
            memo: `Rent payment for ${unitInfo}. Ref: ${reference || "N/A"}`,
          });
          qbSynced = true;
        } catch (qbError) {
          console.error("Failed to sync payment to QuickBooks:", qbError);
        }
      }
    }

    // Email tenant receipt
    try {
      const tenantUser = payment.lease.tenant.user;
      const unitInfo = `${payment.lease.unit.property.name} - Unit ${payment.lease.unit.unitNumber}`;
      await sendTenantEmail({
        tenantName: tenantUser.name,
        tenantEmail: tenantUser.email,
        subject: "Payment Received",
        body: `We have recorded a payment of $${payment.amount.toLocaleString()} for ${unitInfo} on ${new Date(date).toLocaleDateString()}.\n\nReference: ${reference || "N/A"}\n\nThank you for your payment.`,
      });
    } catch (emailErr) {
      console.error("Failed to send payment email:", emailErr);
    }

    return NextResponse.json({ ...payment, qbSynced }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

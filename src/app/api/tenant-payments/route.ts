import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isConnected,
  processCardPayment,
  processBankPayment,
  createPaymentReceipt,
} from "@/lib/quickbooks";

// Check if online payments are available
export async function GET() {
  try {
    const connected = await isConnected();
    return NextResponse.json({ available: connected });
  } catch (error) {
    console.error("Error checking payment availability:", error);
    return NextResponse.json({ available: false });
  }
}

// Process a tenant payment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connected = await isConnected();
    if (!connected) {
      return NextResponse.json({ error: "Online payments are not available" }, { status: 400 });
    }

    const data = await request.json();
    const { paymentMethod, amount, leaseId } = data;

    if (!paymentMethod || !amount || !leaseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the lease belongs to this tenant
    const lease = await db.lease.findFirst({
      where: {
        id: leaseId,
        tenantId: session.user.tenantId,
        status: "ACTIVE",
      },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
      },
    });

    if (!lease) {
      return NextResponse.json({ error: "Invalid lease" }, { status: 400 });
    }

    const tenantName = lease.tenant.user.name;
    const unitInfo = `${lease.unit.property.name} - Unit ${lease.unit.unitNumber}`;
    const description = `Rent payment for ${unitInfo}`;

    let paymentResult;

    try {
      if (paymentMethod === "card") {
        const { card } = data;
        if (!card || !card.number || !card.expMonth || !card.expYear || !card.cvc || !card.name) {
          return NextResponse.json({ error: "Invalid card details" }, { status: 400 });
        }

        paymentResult = await processCardPayment({
          amount: parseFloat(amount),
          card: {
            number: card.number.replace(/\s/g, ""),
            expMonth: card.expMonth,
            expYear: card.expYear,
            cvc: card.cvc,
            name: card.name,
            address: card.address,
          },
          description,
        });
      } else if (paymentMethod === "bank") {
        const { bankAccount } = data;
        if (!bankAccount || !bankAccount.routingNumber || !bankAccount.accountNumber || !bankAccount.name || !bankAccount.phone) {
          return NextResponse.json({ error: "Invalid bank account details" }, { status: 400 });
        }

        paymentResult = await processBankPayment({
          amount: parseFloat(amount),
          bankAccount: {
            name: bankAccount.name,
            routingNumber: bankAccount.routingNumber,
            accountNumber: bankAccount.accountNumber,
            accountType: bankAccount.accountType || "PERSONAL_CHECKING",
            phone: bankAccount.phone,
          },
          description,
        });
      } else {
        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
      }

      // Record the payment in our database
      const payment = await db.payment.create({
        data: {
          leaseId,
          amount: parseFloat(amount),
          date: new Date(),
          method: paymentMethod === "card" ? "CARD" : "ACH",
          reference: paymentResult.id,
          notes: `Online payment via QuickBooks Payments`,
        },
      });

      // Also create a sales receipt in QuickBooks Accounting
      try {
        await createPaymentReceipt({
          tenantName,
          amount: parseFloat(amount),
          date: new Date().toISOString().split("T")[0],
          memo: `${description}. Payment ID: ${paymentResult.id}`,
        });
      } catch (qbError) {
        console.error("Failed to create QB receipt:", qbError);
        // Don't fail the payment if receipt creation fails
      }

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        transactionId: paymentResult.id,
        status: paymentResult.status,
      });
    } catch (paymentError) {
      console.error("Payment processing error:", paymentError);
      return NextResponse.json(
        { error: paymentError instanceof Error ? paymentError.message : "Payment failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

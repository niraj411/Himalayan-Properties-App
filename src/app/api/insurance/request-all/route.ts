import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTenantEmail } from "@/lib/email";
import { insuranceCopy } from "@/lib/insurance";

// Admin-only: email every active, insurance-required lease that lacks a valid
// (verified + unexpired) certificate, asking the tenant to upload one.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leases = await db.lease.findMany({
      where: { status: "ACTIVE", insuranceRequired: true },
      include: {
        tenant: { include: { user: true } },
        unit: { include: { property: true } },
        insurance: true,
      },
    });

    const now = new Date();
    const isCompliant = (records: { verified: boolean; expirationDate: Date }[]) =>
      records.some((r) => r.verified && new Date(r.expirationDate) > now);

    let requested = 0;
    let skipped = 0;

    // Sequential to avoid hammering the single SMTP transporter; volumes are small.
    for (const lease of leases) {
      if (isCompliant(lease.insurance)) {
        skipped++;
        continue;
      }
      const copy = insuranceCopy(lease.leaseType);
      try {
        await sendTenantEmail({
          tenantName: lease.tenant.user.name,
          tenantEmail: lease.tenant.user.email,
          subject: copy.requestSubject,
          body: copy.requestBody(lease.unit.property.name, lease.unit.unitNumber),
        });
        requested++;
      } catch (err) {
        console.error(`Failed to send insurance request for lease ${lease.id}:`, err);
      }
    }

    return NextResponse.json({ requested, skipped });
  } catch (error) {
    console.error("Error sending bulk insurance requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

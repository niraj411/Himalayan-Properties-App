import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTenantEmail } from "@/lib/email";
import { insuranceCopy } from "@/lib/insurance";
import { addDays, format } from "date-fns";

// Daily cron (triggered by the VPS system crontab via curl with a bearer token).
// Emails tenants whose insurance is expiring within the configured lead window
// (or already expired) and that haven't been reminded yet. Sets reminderSent so
// each cert is only chased once per renewal cycle; re-armed when expirationDate
// changes (see PATCH in /api/insurance/[id]).
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await db.settings.findFirst();
    if (settings && settings.insuranceReminderEnabled === false) {
      return NextResponse.json({ skipped: true, reason: "disabled" });
    }
    const leadDays = settings?.insuranceReminderLeadDays ?? 30;

    const candidates = await db.insuranceRecord.findMany({
      where: {
        reminderSent: false,
        // lte the future cutoff naturally includes already-expired certs.
        expirationDate: { lte: addDays(new Date(), leadDays) },
        lease: { status: "ACTIVE", insuranceRequired: true },
      },
      include: {
        lease: { include: { tenant: { include: { user: true } } } },
      },
    });

    let sent = 0;
    for (const record of candidates) {
      const copy = insuranceCopy(record.lease.leaseType);
      const expDate = format(new Date(record.expirationDate), "MMMM d, yyyy");
      try {
        await sendTenantEmail({
          tenantName: record.lease.tenant.user.name,
          tenantEmail: record.lease.tenant.user.email,
          subject: copy.renewalSubject,
          body: copy.renewalBody(expDate),
        });
        // Only flag after a successful send so failures retry next run.
        await db.insuranceRecord.update({
          where: { id: record.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send insurance reminder for record ${record.id}:`, err);
      }
    }

    return NextResponse.json({ sent, candidates: candidates.length });
  } catch (error) {
    console.error("Error running insurance reminder cron:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

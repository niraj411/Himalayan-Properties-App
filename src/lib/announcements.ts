import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export type AnnounceDelivery = "PORTAL" | "EMAIL";

export interface AnnounceInput {
  propertyId: string;
  subject: string;
  body: string;
  deliver?: AnnounceDelivery;
  replyTo?: string | null;
  sentById?: string | null;
}

export interface AnnounceResultRow {
  noticeId: string;
  leaseId: string;
  unit: string;
  tenant: string;
  toEmail: string;
  status: "POSTED" | "SENT" | "FAILED";
}

// Property-wide announcement: one ANNOUNCEMENT Notice per ACTIVE lease at the
// property. PORTAL = visible on each tenant's Notices page, not emailed (status
// POSTED; "Email now" in Admin > Notices emails it later). EMAIL = also emailed
// right away (SENT / FAILED per tenant). Shared by the admin route and the
// trusted agent API so both paths write the same viewable records.
export async function postAnnouncement(input: AnnounceInput): Promise<{ mode: AnnounceDelivery; results: AnnounceResultRow[] }> {
  const subject = input.subject?.trim();
  const body = input.body?.trim();
  if (!input.propertyId || !subject || !body) {
    throw new Error("propertyId, subject and body are required");
  }
  const mode: AnnounceDelivery = input.deliver === "EMAIL" ? "EMAIL" : "PORTAL";

  const leases = await db.lease.findMany({
    where: { status: "ACTIVE", unit: { propertyId: input.propertyId } },
    include: { tenant: { include: { user: true } }, unit: true },
    orderBy: { unit: { unitNumber: "asc" } },
  });
  if (leases.length === 0) {
    throw new Error("No active leases at this property");
  }

  const results: AnnounceResultRow[] = [];
  for (const lease of leases) {
    const toEmail = lease.tenant.user.email;
    const base = {
      leaseId: lease.id,
      type: "ANNOUNCEMENT",
      subject,
      body,
      toEmail,
      replyTo: input.replyTo || null,
      sentById: input.sentById ?? null,
    };
    const row = { leaseId: lease.id, unit: lease.unit.unitNumber, tenant: lease.tenant.user.name, toEmail };

    if (mode === "PORTAL") {
      const n = await db.notice.create({ data: { ...base, status: "POSTED" } });
      results.push({ noticeId: n.id, ...row, status: "POSTED" });
      continue;
    }
    try {
      const info = await sendEmail({ to: toEmail, replyTo: input.replyTo || undefined, subject, body });
      const n = await db.notice.create({ data: { ...base, status: "SENT", messageId: info?.messageId ?? null } });
      results.push({ noticeId: n.id, ...row, status: "SENT" });
    } catch (err) {
      const n = await db.notice.create({
        data: { ...base, status: "FAILED", errorText: err instanceof Error ? err.message : String(err) },
      });
      results.push({ noticeId: n.id, ...row, status: "FAILED" });
    }
  }
  return { mode, results };
}

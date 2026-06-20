import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// One-time backfill: record the past-due rent notice that was emailed to Evelyn
// (Unit A) on 2026-06-19 into the Message log, so there is a viewable record in
// Admin -> Messages. Idempotent: matched by (toId, subject). The proper Notices
// feature will auto-log future notices; this captures the one sent via script.
async function main() {
  const admin =
    (await db.user.findUnique({ where: { email: "niraj411@gmail.com" } })) ||
    (await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }));
  if (!admin) throw new Error("No admin user found.");

  const evelyn = await db.user.findUnique({ where: { email: "yriannaortega9@gmail.com" } });
  if (!evelyn) throw new Error("Evelyn user not found.");

  const subject = "Notice of Past-Due Rent and Demand for Payment — 655 S. Federal Blvd., Unit A";

  const body = `[Sent 2026-06-19 — To: yriannaortega9@gmail.com | CC: arrazololaw@gmail.com (attorney) | Reply-To: niraj411@gmail.com]

HIMALAYAN HOLDING PROPERTY LLC
884 Dakota Lane, Erie, CO 80516

June 19, 2026

Evelyn Yrianna Ortega
Co-Tenant: Fabian Octavio Fiero Vasquez
Guarantor: Elizabeth Mendoza Herrera
655 S. Federal Boulevard, Unit A, Denver, CO 80219

RE: NOTICE OF PAST-DUE RENT AND DEMAND FOR PAYMENT — Unit A

Dear Ms. Ortega:

Our records show that rent for the above premises has not been received and is past due. Under your Lease Agreement (Commencement Date February 8, 2026), rent is due in advance on or before the 1st of each month and is considered late if not received by 5:00 p.m. on the 5th.

The following amounts are currently due and owing:

  June 2026 rent (Baselane Invoice #1341810, due 6/1/2026) ..... $3,257.34
  Late fee (previously assessed) ............................... $40.00
  Late charge per Lease Section 4 .............................. $100.00
  --------------------------------------------------------------------
  TOTAL NOW DUE ............................................... $3,397.34

Under Section 4 of your Lease, rent received after the 5th of the month is subject to a late charge, and continued non-payment constitutes a default.

DEMAND: Please remit the full balance of $3,397.34 within five (5) days of the date of this notice via your Baselane payment portal.

If payment is not received, the Landlord may post a formal 3-day Notice to Quit (Demand for Compliance or Possession), at which point an additional $250.00 administrative fee and $250.00 in attorneys' fees ($500.00 total) will be assessed as permitted under Section 4, and the Landlord may pursue all remedies available under the Lease and Colorado law, including termination of tenancy and eviction. This obligation is jointly and severally guaranteed by the co-tenant and guarantor named above.

If you have already submitted payment or believe this notice is in error, please reply to this email or contact us immediately.

Sincerely,

Himalayan Holding Property LLC
By: ____________________________, General Manager`;

  const sentAt = new Date("2026-06-19T17:00:00.000Z");

  const existing = await db.message.findFirst({ where: { toId: evelyn.id, subject } });
  if (existing) {
    await db.message.update({ where: { id: existing.id }, data: { fromId: admin.id, body, sentAt } });
    console.log(`Updated existing Message ${existing.id} (Evelyn past-due notice).`);
  } else {
    const m = await db.message.create({ data: { fromId: admin.id, toId: evelyn.id, subject, body, sentAt } });
    console.log(`Created Message ${m.id} (Evelyn past-due notice, ${admin.email} -> ${evelyn.email}).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

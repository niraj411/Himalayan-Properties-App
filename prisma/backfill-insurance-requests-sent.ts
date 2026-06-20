import { PrismaClient } from "@prisma/client";
import { insuranceCopy } from "../src/lib/insurance";

const db = new PrismaClient();

// One-time backfill: record the bulk insurance requests sent 2026-06-19 via
// Admin -> Insurance ("request from non-compliant"). That endpoint emailed each
// non-compliant tenant but did not log it, so there was no record. This recreates
// the same recipient set + copy and logs each into the Message log (Admin ->
// Messages). Idempotent: matched by (toId, subject); creates only if missing.
// Going forward the request routes log automatically — this captures the batch
// that predated that change.
async function main() {
  const admin =
    (await db.user.findUnique({ where: { email: "niraj411@gmail.com" } })) ||
    (await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }));
  if (!admin) throw new Error("No admin user found.");

  const leases = await db.lease.findMany({
    where: { status: "ACTIVE", insuranceRequired: true },
    include: {
      tenant: { include: { user: true } },
      unit: { include: { property: true } },
      insurance: true,
    },
  });

  const now = new Date();
  const sentAt = new Date("2026-06-19T18:00:00.000Z");

  let created = 0;
  let skippedExisting = 0;
  let compliant = 0;

  for (const lease of leases) {
    const isCompliant = lease.insurance.some((r) => r.verified && new Date(r.expirationDate) > now);
    if (isCompliant) {
      compliant++;
      continue;
    }
    const copy = insuranceCopy(lease.leaseType);
    const subject = copy.requestSubject;
    const body = copy.requestBody(lease.unit.property.name, lease.unit.unitNumber);

    const existing = await db.message.findFirst({ where: { toId: lease.tenant.userId, subject } });
    if (existing) {
      skippedExisting++;
      continue;
    }
    await db.message.create({
      data: { fromId: admin.id, toId: lease.tenant.userId, subject, body, sentAt },
    });
    created++;
    console.log(`  logged -> ${lease.tenant.user.name} (${lease.tenant.user.email}) [${lease.leaseType}]`);
  }

  console.log(`Insurance-request backfill: created ${created}, skipped(existing) ${skippedExisting}, compliant(skipped) ${compliant}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

// One-time courtesy insurance reminder. Mirrors /api/insurance/request-all
// (active + insurance-required leases, skips already-compliant ones) but with a
// softer, type-aware "courtesy reminder" tone. Logs each send to Messages.
// Terminated leases (e.g. former tenants) and compliant tenants are excluded.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const BENEFICIARY = "Himalayan Holdings Property LLC";

const RESIDENTIAL = {
  subject: "A quick reminder about renters insurance",
  body: (prop: string, unit: string) =>
    `This is a friendly reminder that we ask all residents at ${prop}, Unit ${unit}, to keep an active renters insurance policy, with ${BENEFICIARY} listed as an additional interest.\n\nWhenever you have a moment, please log into your tenant portal and upload your current proof of coverage. If you have already sent it over, thank you, and please disregard this note.\n\nReach out anytime if you have any questions.`,
};

const COMMERCIAL = {
  subject: "A quick reminder about your liability insurance",
  body: (prop: string, unit: string) =>
    `This is a friendly reminder that your commercial lease at ${prop}, Unit ${unit}, asks you to carry active business liability insurance, with ${BENEFICIARY} listed as an additional insured.\n\nWhenever you have a moment, please log into your tenant portal and upload your current certificate of insurance. If you have already sent it over, thank you, and please disregard this note.\n\nReach out anytime if you have any questions.`,
};

(async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { sendTenantEmail } = await import("../src/lib/email");
  const db = new PrismaClient();

  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("No admin user to attribute the message to");

  const leases = await db.lease.findMany({
    where: { status: "ACTIVE", insuranceRequired: true },
    include: { tenant: { include: { user: true } }, unit: { include: { property: true } }, insurance: true },
  });

  const now = new Date();
  const compliant = (recs: { verified: boolean; expirationDate: Date }[]) =>
    recs.some((r) => r.verified && new Date(r.expirationDate) > now);

  let sent = 0;
  let skipped = 0;
  for (const l of leases) {
    if (compliant(l.insurance)) {
      skipped++;
      console.log(`skip (compliant): ${l.tenant.user.name}`);
      continue;
    }
    const copy = l.leaseType === "COMMERCIAL" ? COMMERCIAL : RESIDENTIAL;
    const body = copy.body(l.unit.property.name, l.unit.unitNumber);
    await sendTenantEmail({
      tenantName: l.tenant.user.name,
      tenantEmail: l.tenant.user.email,
      subject: copy.subject,
      body,
    });
    await db.message.create({
      data: { fromId: admin.id, toId: l.tenant.userId, subject: copy.subject, body },
    });
    sent++;
    const kind = l.leaseType === "COMMERCIAL" ? "liability" : "renters";
    console.log(`sent ${kind} -> ${l.tenant.user.name} <${l.tenant.user.email}> (${l.unit.property.name} ${l.unit.unitNumber})`);
  }

  console.log(`\nDone: ${sent} sent, ${skipped} skipped.`);
  await db.$disconnect();
})().catch((e) => {
  console.error("FAILED:", (e as Error).message);
  process.exit(1);
});

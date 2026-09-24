import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// One-time import: 2026-2027 Certificate of Liability Insurance for the
// 655 S Federal Blvd Unit D&E commercial tenant (TZVECL Management of CO, LLC).
// Himalayan Holdings Property LLC is the Additional Insured on the COI.
const LEASE_ID = "cmqlov33i0004l4nuxyxmahmb"; // TZVECL Management of CO, LLC — Unit D&E
const DOCUMENT_URL = "/api/files/tzvecl-de-coi-2026-2027.pdf";

const data = {
  insuranceType: "LIABILITY",
  interestType: "ADDITIONAL_INSURED", // commercial — Himalayan is Additional Insured
  carrier: "State Auto Property & Casualty",
  policyNumber: "BOP2945566", // Commercial General Liability (primary)
  coverageAmount: 2_000_000, // each occurrence ($4M general aggregate)
  // Noon UTC so it renders as Feb 1 in any US timezone (avoids midnight rollover).
  effectiveDate: new Date("2026-02-01T12:00:00Z"),
  expirationDate: new Date("2027-02-01T12:00:00Z"),
  documentUrl: DOCUMENT_URL,
  beneficiaryName: "Himalayan Holdings Property LLC",
  verified: true,
  verifiedAt: new Date(),
  reminderSent: false,
  reminderSentAt: null,
};

(async () => {
  const lease = await db.lease.findUnique({
    where: { id: LEASE_ID },
    include: { tenant: { include: { user: true } }, unit: true },
  });
  if (!lease) throw new Error(`Lease ${LEASE_ID} not found`);

  const existing = await db.insuranceRecord.findFirst({ where: { leaseId: LEASE_ID } });
  const rec = existing
    ? await db.insuranceRecord.update({ where: { id: existing.id }, data })
    : await db.insuranceRecord.create({ data: { leaseId: LEASE_ID, ...data } });

  console.log(`${existing ? "UPDATED" : "CREATED"} insurance record ${rec.id}`);
  console.log(`  tenant : ${lease.tenant.user.name} (Unit ${lease.unit.unitNumber})`);
  console.log(`  carrier: ${rec.carrier} — policy ${rec.policyNumber}`);
  console.log(`  cover  : $${rec.coverageAmount?.toLocaleString()}`);
  console.log(`  period : ${rec.effectiveDate.toISOString().slice(0, 10)} → ${rec.expirationDate.toISOString().slice(0, 10)}`);
  console.log(`  verified: ${rec.verified} | doc: ${rec.documentUrl}`);
  await db.$disconnect();
})().catch(async (e) => {
  console.error("FAILED:", (e as Error).message);
  await db.$disconnect();
  process.exit(1);
});

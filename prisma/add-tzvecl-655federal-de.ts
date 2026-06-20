import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// TZVECL Management of CO, LLC @ 655 S Federal Blvd, Units D&E (commercial).
// Source: "Assignment and Assumption of Lease and Landlord Consent" dated 2025-12-05.
// ABC Eye Care, PLLC (Dr. Matthew Asman) assigned the original 2022 lease to TZVECL.
// Idempotent: safe to re-run. Seeds via Prisma directly, so NO welcome email is sent.
async function main() {
  const property = await db.property.findFirst({
    where: { address: { contains: "655 S Federal" }, city: "Denver" },
  });
  if (!property) throw new Error("Could not find '655 S Federal' property.");

  // The combined commercial suite already exists as a single unit "D&E".
  const unit = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "D&E" },
  });
  if (!unit) throw new Error(`Could not find unit 'D&E' on property ${property.id}.`);

  const BASE_RENT = 4347.08;        // monthly Base Rent as of Effective Date
  const TAXES_OPCOSTS = 1920.58;    // monthly Real Estate Taxes + Operating Costs
  const RENT = +(BASE_RENT + TAXES_OPCOSTS).toFixed(2); // 6267.66 total monthly
  const DEPOSIT = 6000.0;           // security deposit on file, assumed by assignee

  const tempPassword = await bcrypt.hash("changeme123", 10);

  const user = await db.user.upsert({
    where: { email: "accounting@elevatemyeyes.com" },
    update: { name: "TZVECL Management of CO, LLC" },
    create: {
      email: "accounting@elevatemyeyes.com",
      name: "TZVECL Management of CO, LLC",
      password: tempPassword,
      role: "TENANT",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { userId: user.id },
    update: {
      unitId: unit.id,
      moveInDate: new Date("2025-12-05"),
      moveOutDate: new Date("2029-09-30"),
      emergencyContact: "Brad Messinger (CEO)",
    },
    create: {
      userId: user.id,
      unitId: unit.id,
      moveInDate: new Date("2025-12-05"),
      moveOutDate: new Date("2029-09-30"),
      emergencyContact: "Brad Messinger (CEO)",
    },
  });

  await db.unit.update({
    where: { id: unit.id },
    data: { rent: RENT, status: "OCCUPIED" },
  });

  const leaseData = {
    tenantId: tenant.id,
    unitId: unit.id,
    leaseType: "COMMERCIAL",
    startDate: new Date("2025-12-05"), // assignment Effective Date (TZVECL became tenant)
    endDate: new Date("2029-09-30"),   // current term expiration per Landlord Estoppel
    monthlyRent: RENT,
    depositAmount: DEPOSIT,
    depositStatus: "HELD",
    documentUrl: "/api/files/Lease-TZVECL-655Federal-DandE-Assignment.pdf",
    status: "ACTIVE",
    insuranceRequired: true, // commercial: certificate naming Himalayan as additional insured
    notes: [
      "655 S Federal Blvd, Units D&E, Denver CO 80219. Commercial (optometry).",
      "Tenant: TZVECL Management of CO, LLC (contact: Brad Messinger, CEO; accounting@elevatemyeyes.com;",
      "  230 Kings Highway East, Suite 333, Haddonfield, NJ 08033).",
      "Assignment & Assumption of Lease, Effective Date 2025-12-05: original 2022 lease (tenant ABC Eye Care,",
      "  PLLC / Dr. Matthew Asman) assigned to TZVECL. Original Lease dated 2022-06-01; current term expires 2029-09-30.",
      "Rent $6,267.66/mo = Base Rent $4,347.08 + RE Taxes/Operating Costs $1,920.58 (as of Effective Date).",
      "Security deposit $6,000.00 held (assumed by assignee).",
      "Guarantor: TZVECL Holdings, LLC (Brad Messinger), guaranty commences 2027-10-01; prior guarantor",
      "  Dr. Matthew Asman released as of 2027-09-30.",
      "Tenant billed via Baselane (receiving account: Himalayan Holding Property LLC).",
    ].join("\n"),
  };

  const existingLease = await db.lease.findFirst({
    where: { unitId: unit.id, tenantId: tenant.id },
  });
  const lease = existingLease
    ? await db.lease.update({ where: { id: existingLease.id }, data: leaseData })
    : await db.lease.create({ data: leaseData });

  console.log(
    `TZVECL: user ${user.id}, tenant ${tenant.id}, lease ${lease.id} @ Unit D&E. ` +
      `Rent $${RENT}/mo, deposit $${DEPOSIT} HELD, term 2025-12-05 -> 2029-09-30.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

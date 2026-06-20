import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Kenia's Bakery @ 655 S Federal Blvd, Unit B (commercial, ~1008 sf bakery).
// Source: "Kenias_Bakery_Lease_Clean_Final.docx" — 5-year commercial lease.
// Idempotent: safe to re-run. Seeds via Prisma directly, so NO welcome email is sent.
async function main() {
  const property = await db.property.findFirst({
    where: { address: { contains: "655 S Federal" }, city: "Denver" },
  });
  if (!property) throw new Error("Could not find '655 S Federal' property.");

  const unit = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "B" },
  });
  if (!unit) throw new Error(`Could not find unit 'B' on property ${property.id}.`);

  const BASE_RENT_YR1 = 2121.0; // $25.25/sf x 1008 sf = $25,452/yr (Yr1: Oct 2025 - Sep 2026). monthlyRent = base.
  const NNN = 1074.53;          // NNN/CAM = 2025 reconciled actual share $12,894.32/yr / 12 (lease estimate was $11.432/sf = $961/mo)
  const TOTAL = +(BASE_RENT_YR1 + NNN).toFixed(2); // 3195.53 full monthly (base + NNN); used for Unit.rent
  const DEPOSIT = 6000.0;       // due 2025-09-12

  const tempPassword = await bcrypt.hash("changeme123", 10);

  const user = await db.user.upsert({
    where: { email: "keniatiscareno123@gmail.com" },
    update: { name: "Kenia's Bakery", phone: "720-940-6231 / 720-624-9271" },
    create: {
      email: "keniatiscareno123@gmail.com",
      name: "Kenia's Bakery",
      phone: "720-940-6231 / 720-624-9271",
      password: tempPassword,
      role: "TENANT",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { userId: user.id },
    update: {
      unitId: unit.id,
      moveInDate: new Date("2025-09-12"), // Possession Date
      moveOutDate: new Date("2030-09-30"), // Termination Date
      emergencyContact: "Kenia Tiscareno",
      emergencyPhone: "720-624-9271",
    },
    create: {
      userId: user.id,
      unitId: unit.id,
      moveInDate: new Date("2025-09-12"),
      moveOutDate: new Date("2030-09-30"),
      emergencyContact: "Kenia Tiscareno",
      emergencyPhone: "720-624-9271",
    },
  });

  await db.unit.update({
    where: { id: unit.id },
    data: { rent: TOTAL, status: "OCCUPIED" },
  });

  const leaseData = {
    tenantId: tenant.id,
    unitId: unit.id,
    leaseType: "COMMERCIAL",
    startDate: new Date("2025-10-01"), // Commencement Date (rent begins, 5-yr term starts)
    endDate: new Date("2030-09-30"),   // Termination Date
    monthlyRent: BASE_RENT_YR1, // base rent only; NNN/CAM tracked separately
    nnnMonthly: NNN,
    depositAmount: DEPOSIT,
    depositStatus: "HELD",
    depositPaidDate: new Date("2025-09-12"),
    documentUrl: "/api/files/Lease-KeniasBakery-655Federal-UnitB.docx",
    status: "ACTIVE",
    insuranceRequired: true, // commercial: certificate naming Himalayan as additional insured
    notes: [
      "655 S Federal Blvd, Unit B, Denver CO 80219. Commercial bakery, +/- 1008 sf (Tenant's proportional share +/-20%).",
      "Tenant: Kenia's Bakery (contact: Kenia Tiscareno; keniatiscareno123@gmail.com; 720-940-6231 / 720-624-9271).",
      "Possession 2025-09-12 (no rent until commencement); Commencement 2025-10-01; 5-yr term; Termination 2030-09-30.",
      "Total $3,195.53/mo = Base Rent $2,121.00 (Yr1 @ $25.25/sf) + NNN/CAM $1,074.53/mo (2025 reconciled actual share $12,894.32/yr; lease estimate $11.432/sf = $961/mo).",
      "Base Rent schedule, 4% annual increases: Yr1 $2,121 | Yr2 $2,184 | Yr3 $2,250 | Yr4 $2,317 | Yr5 $2,386 (per month).",
      "Security deposit $6,000.00 held (due 2025-09-12). No guarantor named.",
      "Late charge: $50/day or 12% interest (greater) after the 5th; $500 fee if 3-day notice posted. Electricity separately metered.",
      "Options: two 5-yr renewals at FMV (>= 3% over prior rent) on 120 days' notice. Tenant pays HVAC repair/replacement.",
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
    `Kenia's Bakery: user ${user.id}, tenant ${tenant.id}, lease ${lease.id} @ Unit B. ` +
      `Base $${BASE_RENT_YR1}/mo + NNN $${NNN}/mo = $${TOTAL}/mo total, deposit $${DEPOSIT} HELD, term 2025-10-01 -> 2030-09-30.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Lexor Manufacturing, LLC @ 655 S Federal Blvd, Unit C (commercial showroom, ~1008 sf).
// Source: "Unit C Lease 655 S. Federal Blvd.pdf" — 5-year commercial NNN lease (2023-2028).
// Idempotent: safe to re-run. Seeds via Prisma directly, so NO welcome email is sent.
async function main() {
  const property = await db.property.findFirst({
    where: { address: { contains: "655 S Federal" }, city: "Denver" },
  });
  if (!property) throw new Error("Could not find '655 S Federal' property.");

  const unit = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "C" },
  });
  if (!unit) throw new Error(`Could not find unit 'C' on property ${property.id}.`);

  // Current lease-year base rent (6/1/2026 - 5/31/2027) per facing-page schedule.
  const BASE = 2318.00;   // $27.60/sf; monthlyRent = base only
  const NNN = 1074.53;    // NNN/CAM = 2025 reconciled actual share $12,894.32/yr / 12 (lease says "see Section C"; no figure on facing page)
  const TOTAL = +(BASE + NNN).toFixed(2); // 3392.53 recurring monthly (base + NNN); used for Unit.rent
  const DEPOSIT = 1680.0; // security deposit per lease

  const tempPassword = await bcrypt.hash("changeme123", 10);

  const user = await db.user.upsert({
    where: { email: "hanson@lexor.com" },
    update: { name: "Lexor Manufacturing, LLC", phone: "714-414-4144" },
    create: {
      email: "hanson@lexor.com",
      name: "Lexor Manufacturing, LLC",
      phone: "714-414-4144",
      password: tempPassword,
      role: "TENANT",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { userId: user.id },
    update: {
      unitId: unit.id,
      moveInDate: new Date("2023-06-01"), // Commencement (tenant already in place)
      moveOutDate: new Date("2028-05-31"), // Termination
      emergencyContact: "Guarantor: Christopher Luong (full term of lease)",
    },
    create: {
      userId: user.id,
      unitId: unit.id,
      moveInDate: new Date("2023-06-01"),
      moveOutDate: new Date("2028-05-31"),
      emergencyContact: "Guarantor: Christopher Luong (full term of lease)",
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
    startDate: new Date("2023-06-01"), // Commencement Date
    endDate: new Date("2028-05-31"),   // Termination Date
    monthlyRent: BASE, // base rent only (current lease year); NNN/CAM tracked separately
    nnnMonthly: NNN,
    depositAmount: DEPOSIT,
    depositStatus: "HELD",
    documentUrl: "/api/files/Lease-Lexor-655Federal-UnitC.pdf",
    status: "ACTIVE",
    insuranceRequired: true, // commercial: certificate naming Himalayan as additional insured
    notes: [
      "655 S Federal Blvd, Unit C, Denver CO 80219. Commercial showroom (luxury spa chairs), +/- 1008 sf.",
      "Tenant: Lexor Manufacturing, LLC (hanson@lexor.com; 714-414-4144; 7400 Hazard Ave, Westminster CA 92683).",
      "Guarantor: Christopher Luong (full term of lease).",
      "Commencement 2023-06-01; 5-yr term; Termination 2028-05-31 (tenant already in place at signing).",
      "Total $3,392.53/mo = Base Rent $2,318.00 (current yr 6/1/2026-5/31/2027 @ $27.60/sf) + NNN/CAM $1,074.53/mo (2025 reconciled actual share $12,894.32/yr).",
      "Base Rent schedule per facing page: 6/1/23-5/31/24 $2,100 | 6/1/24-5/31/25 $2,184 | 6/1/26-5/31/27 $2,318 | 6/1/27-5/31/28 $2,371 | 6/1/28-5/31/29 $2,507.",
      "  NOTE: facing-page schedule skips 6/1/25-5/31/26 and lists a row past the 5/31/28 termination (template quirk); confirm exact mid-term rent.",
      "  CAM amount not stated on facing page ('see Section C'); NNN set from 2025 reconciliation ($11.432/sf), subject to annual reconciliation.",
      "Security deposit $1,680.00 held.",
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
    `Lexor: user ${user.id}, tenant ${tenant.id}, lease ${lease.id} @ Unit C. ` +
      `Base $${BASE}/mo + NNN $${NNN}/mo = $${TOTAL}/mo total, deposit $${DEPOSIT} HELD, term 2023-06-01 -> 2028-05-31.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

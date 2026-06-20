import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Idempotent: match an existing charge by (leaseId, source, label) and update,
// otherwise create. Safe to re-run; won't duplicate.
async function upsertCharge(c: {
  leaseId: string;
  kind: string;
  label: string;
  amount: number;
  dueDate: Date;
  source: string;
}) {
  const existing = await db.charge.findFirst({
    where: { leaseId: c.leaseId, source: c.source, label: c.label },
  });
  if (existing) {
    await db.charge.update({
      where: { id: existing.id },
      data: { kind: c.kind, amount: c.amount, dueDate: c.dueDate, status: "OPEN" },
    });
  } else {
    await db.charge.create({ data: { ...c, status: "OPEN" } });
  }
}

async function main() {
  // ---- Evelyn Ortega @ 655 S Federal Blvd, Unit A (the "Himalayan Holdings Property") ----
  const property = await db.property.findFirst({
    where: { address: { contains: "655 S Federal" }, city: "Denver" },
  });
  if (!property) throw new Error("Could not find '655 S Federal' property.");

  const unitA = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "A" },
  });
  if (!unitA) throw new Error(`Could not find unit 'A' on property ${property.id}.`);

  // Authoritative values from the SIGNED Unit A lease (Lease Date Feb 8, 2026).
  const BASE = 2184.00;   // Yr1 base rent ($26.00/sf); Yr2 (2/1/2027-2/29/2028) = $2,271.36 ($27.04/sf)
  const NNN = 1071.18;    // CAM/NNN per lease: $12.75/sf ($1,071.18/mo), Q1-annual reconciliation
  const TOTAL = +(BASE + NNN).toFixed(2); // 3255.18 recurring monthly (base + CAM); used for Unit.rent
  const DEPOSIT = 6510.36; // 2x (base + CAM) = 2 x 3255.18, due 2026-02-08
  const tempPassword = await bcrypt.hash("changeme123", 10);

  const user = await db.user.upsert({
    where: { email: "yriannaortega9@gmail.com" },
    update: { name: "Evelyn Yrianna Ortega", phone: "720-412-5244 / 303-912-0732" },
    create: {
      email: "yriannaortega9@gmail.com",
      name: "Evelyn Yrianna Ortega",
      phone: "720-412-5244 / 303-912-0732",
      password: tempPassword,
      role: "TENANT",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { userId: user.id },
    update: {
      unitId: unitA.id,
      moveInDate: new Date("2026-02-08"),
      moveOutDate: new Date("2028-02-01"),
      emergencyContact: "Co-tenant: Fabian Octavio Fiero Vasquez; Guarantor: Elizabeth Mendoza Herrera (520 Utica St, Denver CO 80204)",
    },
    create: {
      userId: user.id,
      unitId: unitA.id,
      moveInDate: new Date("2026-02-08"),
      moveOutDate: new Date("2028-02-01"),
      emergencyContact: "Co-tenant: Fabian Octavio Fiero Vasquez; Guarantor: Elizabeth Mendoza Herrera (520 Utica St, Denver CO 80204)",
    },
  });

  await db.unit.update({
    where: { id: unitA.id },
    data: { rent: TOTAL, status: "OCCUPIED" },
  });

  const leaseData = {
    tenantId: tenant.id,
    unitId: unitA.id,
    leaseType: "COMMERCIAL",
    startDate: new Date("2026-02-08"), // Commencement Date (rent begins, 2-yr term)
    endDate: new Date("2028-02-01"),   // Termination Date
    monthlyRent: BASE, // base rent only; NNN/CAM tracked separately
    nnnMonthly: NNN,
    depositAmount: DEPOSIT,
    depositStatus: "HELD",
    depositPaidDate: new Date("2026-02-08"),
    documentUrl: "/api/files/Lease-Evelyn-655Federal-UnitA-Signed-2026.pdf",
    status: "ACTIVE",
    notes: [
      "655 S Federal Blvd, Unit A, Denver CO 80219. Commercial flower shop, +/- 1008 sf. Signed lease dated 2026-02-08.",
      "Tenant: Evelyn Yrianna Ortega (yriannaortega9@gmail.com; 720-412-5244 / 303-912-0732).",
      "Co-tenant: Fabian Octavio Fiero Vasquez. Guarantor: Elizabeth Mendoza Herrera (520 Utica St, Denver CO 80204).",
      "  All three signed the Lease Guaranty (jointly/severally liable). No portal accounts for co-tenant/guarantor (no emails on file).",
      "Possession & Commencement 2026-02-08; 2-yr term; Termination 2028-02-01.",
      "Total $3,255.18/mo = Base Rent $2,184.00 (Yr1 @ $26.00/sf) + CAM/NNN $1,071.18/mo ($12.75/sf, Q1-annual reconciliation).",
      "Base Rent schedule, 4% annual: Yr1 (2/8/2026-1/31/2027) $2,184.00 | Yr2 (2/1/2027-2/29/2028) $2,271.36 (per month).",
      "Security deposit $6,510.36 held = 2x (base + CAM), due 2026-02-08.",
      "Option: two 5-yr renewals at FMV (>= 3% over prior rent) on 120 days' notice.",
      "Tenant's attorney: Gilbert Arrazolo, Arrazolo Law P.C., 908 Lomas Blvd NW, Albuquerque NM 87102; arrazololaw@gmail.com; (505) 247-0798.",
      "Tenant billed via Baselane (receiving account: Himalayan Holding Property LLC).",
    ].join("\n"),
  };

  const existingLease = await db.lease.findFirst({
    where: { unitId: unitA.id, tenantId: tenant.id },
  });
  const lease = existingLease
    ? await db.lease.update({ where: { id: existingLease.id }, data: leaseData })
    : await db.lease.create({ data: leaseData });

  // Evelyn's outstanding (Baselane invoice #1341810, due 2026-06-01; late fee added 2026-06-06)
  await upsertCharge({ leaseId: lease.id, kind: "RENT", label: "Rent (Invoice #1341810)", amount: 3257.34, dueDate: new Date("2026-06-01"), source: "Baselane #1341810" });
  await upsertCharge({ leaseId: lease.id, kind: "LATE_FEE", label: "Late fee", amount: 40.0, dueDate: new Date("2026-06-06"), source: "Baselane #1341810" });

  console.log(`Evelyn: user ${user.id}, lease ${lease.id}. Base $${BASE} + NNN $${NNN} = $${TOTAL}/mo. 2 charges ($3,297.34 past due).`);

  // ---- Darin Boyer final invoice (existing TERMINATED lease @ 3174 W Center Ave Unit A) ----
  const darin = await db.user.findUnique({ where: { email: "darinboyer2000@gmail.com" } });
  if (darin) {
    const dTenant = await db.tenant.findUnique({ where: { userId: darin.id } });
    const dLease = dTenant
      ? await db.lease.findFirst({ where: { tenantId: dTenant.id }, orderBy: { createdAt: "desc" } })
      : null;
    if (dLease) {
      const src = "Baselane #1663956";
      const due = new Date("2026-06-17");
      await upsertCharge({ leaseId: dLease.id, kind: "FINAL", label: "Final rent", amount: 1167.5, dueDate: due, source: src });
      await upsertCharge({ leaseId: dLease.id, kind: "UTILITY", label: "Electricity usage", amount: 72.0, dueDate: due, source: src });
      await upsertCharge({ leaseId: dLease.id, kind: "UTILITY", label: "Water", amount: 96.0, dueDate: due, source: src });
      await upsertCharge({ leaseId: dLease.id, kind: "CLEANING", label: "Final cleaning (fridge, trash, bathrooms, floors)", amount: 175.0, dueDate: due, source: src });
      console.log(`Darin: lease ${dLease.id}. 4 charges ($1,510.50 final invoice).`);
    } else {
      console.log("Darin: no lease found, skipped charges.");
    }
  } else {
    console.log("Darin: user not found, skipped charges.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

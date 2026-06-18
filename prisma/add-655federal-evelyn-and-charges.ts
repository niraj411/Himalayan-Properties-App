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

  const RENT = 3257.34;
  const tempPassword = await bcrypt.hash("changeme123", 10);

  const user = await db.user.upsert({
    where: { email: "yriannaortega9@gmail.com" },
    update: { name: "Evelyn Elizabeth Yrianna Ortega", phone: "720-412-5244" },
    create: {
      email: "yriannaortega9@gmail.com",
      name: "Evelyn Elizabeth Yrianna Ortega",
      phone: "720-412-5244",
      password: tempPassword,
      role: "TENANT",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { userId: user.id },
    update: { unitId: unitA.id, moveInDate: new Date("2026-02-01"), moveOutDate: new Date("2031-01-31") },
    create: {
      userId: user.id,
      unitId: unitA.id,
      moveInDate: new Date("2026-02-01"),
      moveOutDate: new Date("2031-01-31"),
    },
  });

  await db.unit.update({
    where: { id: unitA.id },
    data: { rent: RENT, status: "OCCUPIED" },
  });

  const leaseData = {
    tenantId: tenant.id,
    unitId: unitA.id,
    leaseType: "COMMERCIAL",
    startDate: new Date("2026-02-01"),
    endDate: new Date("2031-01-31"),
    monthlyRent: RENT,
    depositAmount: RENT, // 1 month's rent (approx, confirm)
    status: "ACTIVE",
    notes: [
      "655 South Federal Blvd, Unit A, Denver CO 80219. Commercial, 5-year term.",
      "Dates APPROXIMATE: 'started Feb 2026' -> entered 2026-02-01 to 2031-01-31. Confirm exact term.",
      "Rent $3,257.34/mo. Deposit recorded as 1 month rent (approx, confirm).",
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

  console.log(`Evelyn: user ${user.id}, lease ${lease.id}. 2 charges ($3,297.34 past due).`);

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

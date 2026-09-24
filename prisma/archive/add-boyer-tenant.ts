import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const property = await db.property.findFirst({
    where: {
      address: { contains: "3174 W Center" },
      city: "Denver",
    },
  });
  if (!property) throw new Error("Could not find '3174 W Center Ave' property.");

  const unit = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "A" },
  });
  if (!unit) throw new Error(`Could not find unit 'A' on property ${property.id}.`);

  const tempPassword = await bcrypt.hash("changeme123", 10);

  const tenantData = {
    name: "Darin Ray Boyer",
    email: "darinboyer2000@gmail.com",
    phone: "512-299-2364",
  };

  const user = await db.user.upsert({
    where: { email: tenantData.email },
    update: { name: tenantData.name, phone: tenantData.phone },
    create: {
      email: tenantData.email,
      name: tenantData.name,
      phone: tenantData.phone,
      password: tempPassword,
      role: "TENANT",
    },
  });

  const tenant = await db.tenant.upsert({
    where: { userId: user.id },
    update: {
      unitId: unit.id,
      moveInDate: new Date("2026-05-07"),
      moveOutDate: new Date("2027-04-30"),
    },
    create: {
      userId: user.id,
      unitId: unit.id,
      moveInDate: new Date("2026-05-07"),
      moveOutDate: new Date("2027-04-30"),
    },
  });

  await db.unit.update({
    where: { id: unit.id },
    data: { rent: 2485, status: "OCCUPIED" },
  });

  const existingLease = await db.lease.findFirst({
    where: { unitId: unit.id, status: "ACTIVE" },
  });

  const documentUrl = "/uploads/Lease-Darin-Boyer-2026-2027.pdf";

  const leaseData = {
    tenantId: tenant.id,
    unitId: unit.id,
    leaseType: "RESIDENTIAL",
    startDate: new Date("2026-05-07"),
    endDate: new Date("2027-04-30"),
    monthlyRent: 2485,
    depositAmount: 4287.5,
    status: "ACTIVE",
    documentUrl,
    notes: [
      "Premises: 3174 W Center Ave, Unit A, Denver CO 80219 (front side of duplex; front driveway parking only, rear yard/parking reserved for 3176).",
      "Rent: $2,485/mo = $2,450 base + $35 pet rent. Annual term total: $29,339.03.",
      "Prorated first month (May 7-31, 2026 = 25/31 days): $2,004.03 due on/before 2026-05-07. Full $2,485 installments begin 2026-06-01.",
      "Security deposit: $4,287.50. Pet damage deposit waived for the authorized ball python (Python regius) per Clause 8.",
      "Pet: 1 ball python (caged at all times; UL-listed heating; renter's insurance must include pet coverage with Himalaya LLC + Raj Gautam as additional interested parties).",
      "Holdover: $200/day if tenant fails to vacate. Late fee: greater of $50 or 5% after 7 days. Returned payment fee: $35.",
      "Month-to-month holdover rate (from 2027-05-01): $2,852.50 ($2,817.50 base + $35 pet, 15% escalation on base).",
      "Utilities in landlord name (Xcel electric/gas, Denver Water, Denver trash); tenant reimburses at cost within 10 days of bill. Tenant arranges internet/cable/phone directly.",
      "Tenant already has a registered Baselane account.",
    ].join("\n"),
  };

  if (existingLease) {
    await db.lease.update({
      where: { id: existingLease.id },
      data: leaseData,
    });
  } else {
    await db.lease.create({ data: leaseData });
  }

  console.log(
    `Done. Property ${property.id}, Unit ${unit.id} (${unit.unitNumber}).`
  );
  console.log(`Tenant: ${user.name} <${user.email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

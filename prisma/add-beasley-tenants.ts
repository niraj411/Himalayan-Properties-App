import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const property = await db.property.findFirst({
    where: {
      address: { contains: "3878 Beasley" },
      city: "Erie",
    },
  });
  if (!property) throw new Error("Could not find '3878 Beasley Dr' property.");

  const unit = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "A" },
  });
  if (!unit) throw new Error(`Could not find unit 'A' on property ${property.id}.`);

  const tempPassword = await bcrypt.hash("changeme123", 10);

  const tenantsData = [
    {
      name: "Andrew Stohrer-Ellis Wylde",
      email: "drewkakes@gmail.com",
      phone: "857-204-3254",
    },
    {
      name: "Katherine Spencer-McLarty Wylde",
      email: "us@drewkates.io",
      phone: "617-767-2548",
    },
  ];

  const tenantRecords = [];
  for (const t of tenantsData) {
    const user = await db.user.upsert({
      where: { email: t.email },
      update: { name: t.name, phone: t.phone },
      create: {
        email: t.email,
        name: t.name,
        phone: t.phone,
        password: tempPassword,
        role: "TENANT",
      },
    });

    const tenant = await db.tenant.upsert({
      where: { userId: user.id },
      update: {
        unitId: unit.id,
        moveInDate: new Date("2026-05-01"),
        moveOutDate: new Date("2027-04-30"),
      },
      create: {
        userId: user.id,
        unitId: unit.id,
        moveInDate: new Date("2026-05-01"),
        moveOutDate: new Date("2027-04-30"),
      },
    });
    tenantRecords.push({ tenant, user });
  }

  await db.unit.update({
    where: { id: unit.id },
    data: { rent: 3200, status: "OCCUPIED" },
  });

  const primary = tenantRecords[0].tenant;
  const coTenantNames = tenantRecords
    .slice(1)
    .map((r) => `${r.user.name} (${r.user.email})`)
    .join("; ");

  const existingLease = await db.lease.findFirst({
    where: { unitId: unit.id, status: "ACTIVE" },
  });

  const allTenantIds = tenantRecords.map((r) => r.tenant.id);
  const documentUrl = "/uploads/Lease-Andrew-Wylde-2026-2027.pdf";

  const leaseData = {
    tenantId: primary.id,
    unitId: unit.id,
    leaseType: "RESIDENTIAL",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2027-04-30"),
    monthlyRent: 3200,
    depositAmount: 3200,
    status: "ACTIVE",
    documentUrl,
    notes: [
      "Premises: 3878 Beasley Dr, Erie CO 80516. Landlord: Neera Gautam.",
      "Rent: $3,200/mo. Annual: $38,400.",
      "Security deposit: $3,200. No pets permitted (pet deposit $400 would apply only if registered).",
      `Jointly & severally liable co-tenants: ${coTenantNames}.`,
      "Holdover: $200/day. Late fee: greater of $50 or 5% after 7 days. Returned check: $35.",
      "Utilities paid by tenant: Xcel (heat/gas), Town of Erie (water/trash).",
    ].join("\n"),
  };

  if (existingLease) {
    await db.lease.update({
      where: { id: existingLease.id },
      data: {
        ...leaseData,
        coTenants: { set: allTenantIds.map((id) => ({ id })) },
      },
    });
  } else {
    await db.lease.create({
      data: {
        ...leaseData,
        coTenants: { connect: allTenantIds.map((id) => ({ id })) },
      },
    });
  }

  console.log(
    `Done. Property ${property.id}, Unit ${unit.id} (${unit.unitNumber}).`
  );
  console.log(
    "Tenants:",
    tenantRecords.map((r) => `${r.user.name} <${r.user.email}>`).join(", ")
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

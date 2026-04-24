import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Find the existing 3174 W Center Ave property
  const property = await db.property.findFirst({
    where: {
      address: { contains: "3174 W Center" },
      city: "Denver",
    },
  });
  if (!property) {
    throw new Error(
      "Could not find '3174 W Center Ave' property. Create the property first."
    );
  }

  // Find unit B (the $2,750 side; 3176 W Center is unit B of the 3174 duplex)
  const unit = await db.unit.findFirst({
    where: { propertyId: property.id, unitNumber: "B" },
  });
  if (!unit) {
    throw new Error(
      `Could not find unit 'B' on property ${property.id}. Create the unit first.`
    );
  }

  const tempPassword = await bcrypt.hash("changeme123", 10);

  const tenantsData = [
    {
      name: "Claire LuzMary Hessek",
      email: "hessekclaire@gmail.com",
      phone: "720-257-3643",
    },
    {
      name: "Stephanie Del Carmen Gonzalez",
      email: "gonztiffy@gmail.com",
      phone: "720-698-7171",
    },
    {
      name: "Erick Danery Iazo",
      email: "erickdanery@icloud.com",
      phone: "720-771-5075",
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

  // Update unit rent + status
  await db.unit.update({
    where: { id: unit.id },
    data: { rent: 2791.25, status: "OCCUPIED" },
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
  const documentUrl = "/uploads/3176_W_Center_Ave_Lease_2026-2027.pdf";

  const leaseData = {
    tenantId: primary.id,
    unitId: unit.id,
    leaseType: "RESIDENTIAL",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2027-04-30"),
    monthlyRent: 2791.25,
    depositAmount: 3050,
    status: "ACTIVE",
    documentUrl,
    notes: [
      "Premises: 3176 W Center Ave, Denver, CO 80219 (Unit B of the 3174 duplex).",
      "Rent breakdown: $2,750.00 base + $41.25 pet rent = $2,791.25/mo. Annual: $33,495.00.",
      "Security deposit: $2,750.00 + $300.00 refundable pet damage deposit = $3,050.00 total.",
      `Jointly & severally liable co-tenants: ${coTenantNames}.`,
      "Holdover: $200/day. Late fee: greater of $50 or 5% after 7 days.",
      "Month-to-month holdover rate (from 2027-05-01): $3,203.75 ($3,162.50 base + $41.25 pet, 15% escalation).",
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

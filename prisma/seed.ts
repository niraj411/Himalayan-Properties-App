import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as bcrypt from "bcryptjs";

// Initialize with libsql adapter for Prisma 7
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@himalayan.com" },
    update: {},
    create: {
      email: "admin@himalayan.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      phone: "(555) 123-4567",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Himalayan Properties",
      companyEmail: "contact@himalayan.com",
      companyPhone: "(555) 123-4567",
      companyAddress: "123 Main Street\nCity, State 12345",
      bankName: "Example Bank",
      bankRoutingNumber: "123456789",
      bankAccountNumber: "987654321",
      checkMailingAddress: "Himalayan Properties\nPO Box 123\nCity, State 12345",
      paymentInstructions: "Please include your unit number in the memo field when making payments.",
    },
  });

  console.log("Created default settings");

  console.log("\n-----------------------------------");
  console.log("Seed completed successfully!");
  console.log("-----------------------------------");
  console.log("\nAdmin login credentials:");
  console.log("Email: admin@himalayan.com");
  console.log("Password: admin123");
  console.log("\n(Please change the password after first login)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

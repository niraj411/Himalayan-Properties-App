import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Refresh 3174 W Center Ave public listing description after Unit A returned to
 * market (Boyer lease break). Fixes stale facts: rent $2,700 -> $2,500, "both
 * units vacant" -> only Unit A (this side) available, availability -> now.
 * Idempotent.
 */
const DESCRIPTION = `Duplex features two updated units, each with new appliances, countertops, flooring, and fresh interior paint. A new roof was installed in 2025. Ideally located near downtown Denver with easy access to shopping, dining, and entertainment.

🏠 2 Bed / 2 Bath Duplex Unit — $2,500/mo
📍 3174 W Center Ave, Denver CO 80219 (Westwood)
Spacious 2-bedroom side of a duplex with your own private entrance, fenced yard, and driveway parking. Kitchen has granite countertops, wood cabinets, and full appliance package. Two full bathrooms with tile. Laminate floors throughout. Your own thermostat — you control the heat. Full-size washer and dryer included (in the basement). Brand new roof as of 2025.
Quick access to Federal Blvd, US-285, and I-25. Close to restaurants, shopping, and RTD bus lines.
🔑 Available: Now
💰 $2,500/month
🚭 No smoking
⚡ Tenant pays gas & electric
Serious inquiries only. Message or call to schedule a showing.`;

async function main() {
  const property = await db.property.findFirst({
    where: { address: { contains: "3174 W Center" } },
  });
  if (!property) throw new Error("Could not find 3174 W Center Ave property.");

  await db.property.update({
    where: { id: property.id },
    data: { description: DESCRIPTION },
  });

  console.log(`Updated description for ${property.name} (${property.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

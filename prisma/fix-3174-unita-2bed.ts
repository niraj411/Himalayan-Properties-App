import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Correct the advertised bed count in the 3174 W Center Ave listing blurb.
 * The Unit A record is already 2bd/2ba/$2,500 — only the prose description
 * (from update-3174-description.ts) wrongly said "3 Bed / 2 Bath". Idempotent.
 */
async function main() {
  const p = await db.property.findFirst({
    where: { address: { contains: "3174 W Center" } },
  });
  if (!p) throw new Error("Could not find 3174 W Center Ave property.");

  const fixed = (p.description ?? "")
    .replace("3 Bed / 2 Bath", "2 Bed / 2 Bath")
    .replace("Spacious 3-bedroom side", "Spacious 2-bedroom side");

  if (fixed === p.description) {
    console.log("Description already correct — nothing to change.");
    return;
  }

  await db.property.update({ where: { id: p.id }, data: { description: fixed } });
  console.log(`Fixed advertised bed count in description for ${p.name} (${p.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

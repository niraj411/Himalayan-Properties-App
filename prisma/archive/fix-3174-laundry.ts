import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Correct the 3174 W Center Ave listing: the unit INCLUDES a washer and dryer,
 * not just hookups. Idempotent string fix on the description.
 */
async function main() {
  const p = await db.property.findFirst({
    where: { address: { contains: "3174 W Center" } },
  });
  if (!p) throw new Error("Could not find 3174 W Center Ave property.");

  const fixed = (p.description ?? "").replace(
    "Washer/dryer hookups in the basement.",
    "Full-size washer and dryer included (in the basement).",
  );

  if (fixed === p.description) {
    console.log("Description already correct — nothing to change.");
    return;
  }

  await db.property.update({ where: { id: p.id }, data: { description: fixed } });
  console.log(`Updated washer/dryer wording for ${p.name} (${p.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

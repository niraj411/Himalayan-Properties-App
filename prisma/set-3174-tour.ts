import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Attach the AI-generated 3D tour assets to the 3174 W Center Ave listing.
 * Assets live in public/uploads/properties/ (copy to .next/standalone/public
 * on the VPS, same as other uploads). If the property is missing (fresh local
 * dev DB), a minimal copy is created so the listing page can be tested.
 * Idempotent.
 */
const TOUR_VIDEO = "/uploads/properties/3174-tour.mp4";
const TOUR_MODEL = "/uploads/properties/3174-exterior-3d.glb";

async function main() {
  let property = await db.property.findFirst({
    where: { address: { contains: "3174 W Center" } },
  });

  if (!property) {
    property = await db.property.create({
      data: {
        name: "3174 W Center Ave Duplex",
        type: "RESIDENTIAL",
        address: "3174 W Center Ave",
        city: "Denver",
        state: "CO",
        zip: "80219",
        description:
          "Duplex features two updated units, each with new appliances, countertops, flooring, and fresh interior paint. A new roof was installed in 2025.",
        imageUrl: "/uploads/properties/3174_Front.jpg",
        photos: JSON.stringify([
          "/uploads/properties/3174_livingroom.jpg",
          "/uploads/properties/3174_kitchen.jpg",
        ]),
        units: {
          create: { unitNumber: "A", bedrooms: 3, bathrooms: 2, rent: 2500, status: "VACANT" },
        },
      },
    });
    console.log(`Created local test property ${property.id}.`);
  }

  await db.property.update({
    where: { id: property.id },
    data: { tourVideoUrl: TOUR_VIDEO, tourModelUrl: TOUR_MODEL },
  });

  console.log(`Set 3D tour on ${property.name} (${property.id}).`);
  console.log(`  video: ${TOUR_VIDEO}`);
  console.log(`  model: ${TOUR_MODEL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

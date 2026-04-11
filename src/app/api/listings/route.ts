import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — no auth required
export async function GET() {
  try {
    const properties = await db.property.findMany({
      where: {
        units: { some: { status: "VACANT" } },
      },
      include: {
        units: {
          where: { status: "VACANT" },
          orderBy: { unitNumber: "asc" },
          select: {
            id: true,
            unitNumber: true,
            bedrooms: true,
            bathrooms: true,
            sqft: true,
            rent: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const listings = properties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      description: p.description,
      imageUrl: p.imageUrl,
      photos: p.photos ? JSON.parse(p.photos) : [],
      zillowUrl: p.zillowUrl,
      vacantUnits: p.units,
    }));

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

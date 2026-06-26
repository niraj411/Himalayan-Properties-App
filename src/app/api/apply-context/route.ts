import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public context for the /apply form. Returns only non-sensitive fields an
// applicant needs — the property list (for the dropdown + per-property Zillow
// link) and the global fallback Zillow URL. The full /api/properties and
// /api/settings endpoints stay authenticated; this is the safe public subset.
export async function GET() {
  try {
    const [properties, settings] = await Promise.all([
      db.property.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, type: true, zillowUrl: true },
      }),
      db.settings.findFirst({ select: { zillowUrl: true } }),
    ]);
    return NextResponse.json({ properties, zillowUrl: settings?.zillowUrl ?? null });
  } catch (error) {
    console.error("Error fetching apply context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

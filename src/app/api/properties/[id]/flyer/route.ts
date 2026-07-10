import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PropertyFlyer } from "@/lib/pdf/PropertyFlyer";
import { loadCompany } from "@/lib/pdf/company";
import { pdfResponse } from "@/lib/pdf/render";
import { dateFmt } from "@/lib/pdf/theme";
import { imageSrc, firstImageSrc, qrDataUrl } from "@/lib/pdf/assets";
import { unauthorized, notFound } from "@/lib/pdf/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePhotos(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Pull short, truthful highlight lines out of the listing description (the
// emoji/bullet lines) so the flyer never invents features. Leading emoji and
// symbols are stripped.
function highlightsFrom(description: string | null): string[] {
  if (!description) return [];
  const out: string[] = [];
  for (const rawLine of description.split("\n")) {
    const line = rawLine
      .replace(/^[\s\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}•\-–*]+/u, "")
      .trim();
    if (!line) continue;
    if (line.length > 3 && line.length <= 46 && !/[.!?]$/.test(line)) out.push(line);
    if (out.length >= 6) break;
  }
  return out;
}

// GET /api/properties/[id]/flyer -> printable listing flyer PDF (admin only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.role !== "ADMIN") return notFound();

  const property = await db.property.findUnique({
    where: { id },
    include: { units: { orderBy: { unitNumber: "asc" } } },
  });
  if (!property) return notFound();

  const company = await loadCompany();

  // Advertise a vacant unit if there is one, otherwise the first unit.
  const unit = property.units.find((u) => u.status === "VACANT") ?? property.units[0];
  const anyVacant = property.units.some((u) => u.status === "VACANT");

  const photos = parsePhotos(property.photos);
  const heroSrc = await firstImageSrc([property.imageUrl, ...photos]);
  const thumbCandidates = [...photos, property.imageUrl].filter((u) => u && u !== property.imageUrl);
  const thumbs: string[] = [];
  for (const u of thumbCandidates) {
    const src = await imageSrc(u);
    if (src && src !== heroSrc) thumbs.push(src);
    if (thumbs.length >= 2) break;
  }

  const listingUrl = `${new URL(req.url).origin}/listings/${property.id}`;
  const qrSrc = await qrDataUrl(listingUrl);

  const typeLabel =
    property.units.length === 2 ? "Duplex" : property.type === "COMMERCIAL" ? "Commercial" : "Residential";
  const firstPara = (property.description ?? "").split(/\n\s*\n/)[0]?.trim().slice(0, 340) || null;

  const doc = PropertyFlyer({
    company,
    headline: property.address,
    addressLine: `${property.city}, ${property.state} ${property.zip}`,
    price: unit?.rent ?? null,
    priceLabel: "per month",
    beds: unit?.bedrooms ?? null,
    baths: unit?.bathrooms ?? null,
    sqft: unit?.sqft ?? null,
    typeLabel,
    description: firstPara,
    highlights: highlightsFrom(property.description),
    heroSrc,
    thumbs,
    qrSrc,
    listingUrl: listingUrl.replace(/^https?:\/\//, ""),
    phone: company.phone,
    availability: anyVacant ? "Available Now" : undefined,
    generatedOn: dateFmt(new Date()),
  });

  const slug = property.address.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return pdfResponse(doc, `flyer-${slug}.pdf`);
}

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
import { commercialPricing, usd } from "@/lib/commercial";

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

  // Advertise the requested unit (?unitId=), else a vacant one, else the first.
  const wantedId = new URL(req.url).searchParams.get("unitId");
  const unit =
    (wantedId ? property.units.find((u) => u.id === wantedId) : undefined) ??
    property.units.find((u) => u.status === "VACANT") ??
    property.units[0];
  const anyVacant = property.units.some((u) => u.status === "VACANT");
  const commercial = property.type === "COMMERCIAL";
  const pricing = commercial && unit ? commercialPricing(unit) : null;

  const photos = parsePhotos(property.photos);
  const heroSrc = await firstImageSrc([property.imageUrl, ...photos]);
  const thumbCandidates = [...photos, property.imageUrl].filter((u) => u && u !== property.imageUrl);
  const thumbs: string[] = [];
  for (const u of thumbCandidates) {
    const src = await imageSrc(u);
    if (src && src !== heroSrc) thumbs.push(src);
    if (thumbs.length >= 2) break;
  }

  // Behind the CloudPanel proxy req.url reports the internal origin (localhost),
  // so build public links from the configured site URL first.
  const fwdHost = req.headers.get("x-forwarded-host");
  const fwdProto = req.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    (fwdHost ? `${fwdProto}://${fwdHost}` : new URL(req.url).origin);
  const listingUrl = `${origin}/listings/${property.id}`;
  const qrSrc = await qrDataUrl(listingUrl);

  const typeLabel =
    property.units.length === 2 ? "Duplex" : property.type === "COMMERCIAL" ? "Commercial" : "Residential";
  const rawFirst = (property.description ?? "").split(/\n\s*\n/)[0]?.trim() || "";
  // Commercial flyers lead with the description's first sentence as the tagline
  // and print the rest (capped) below it, so the sentence is not shown twice and
  // the single page holds the contact strip.
  const sentences = rawFirst.split(/(?<=[.!?])\s+/);
  const tagline = commercial ? (sentences[0]?.slice(0, 90) || "Retail / office space for lease") : undefined;
  const firstPara = commercial
    ? sentences.slice(1).join(" ").trim().slice(0, 230) || null
    : rawFirst.slice(0, 340) || null;

  const doc = PropertyFlyer({
    company,
    headline: property.address,
    addressLine: `${property.city}, ${property.state} ${property.zip}`,
    price: unit?.rent ?? null,
    priceLabel: commercial ? "per month, base rent" : "per month",
    beds: unit?.bedrooms ?? null,
    baths: unit?.bathrooms ?? null,
    sqft: unit?.sqft ?? null,
    typeLabel,
    commercial,
    unitLabel: commercial && unit ? `Unit ${unit.unitNumber}` : undefined,
    perSfLabel: pricing?.perSf != null ? usd(pricing.perSf) : undefined,
    nnnLabel: pricing?.nnn != null ? usd(pricing.nnn) : undefined,
    tagline,
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

  const slug = `${property.address}${commercial && unit ? `-unit-${unit.unitNumber}` : ""}`
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return pdfResponse(doc, `flyer-${slug}.pdf`);
}

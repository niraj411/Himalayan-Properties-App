import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import {
  Building2, Home, Store, MapPin, ArrowLeft,
  BedDouble, Bath, Maximize2, ExternalLink, ChevronRight,
} from "lucide-react";

async function getListing(id: string) {
  const property = await db.property.findUnique({
    where: { id },
    include: {
      units: {
        where: { status: "VACANT" },
        orderBy: { unitNumber: "asc" },
        select: { id: true, unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, rent: true },
      },
    },
  });
  return property;
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing || listing.units.length === 0) notFound();

  const allPhotos: string[] = [
    ...(listing.imageUrl ? [listing.imageUrl] : []),
    ...(listing.photos ? JSON.parse(listing.photos) : []),
  ];

  const applyHref =
    listing.type === "RESIDENTIAL" && listing.zillowUrl
      ? listing.zillowUrl
      : `/apply?propertyId=${listing.id}`;
  const applyIsExternal = listing.type === "RESIDENTIAL" && !!listing.zillowUrl;

  return (
    <div className="min-h-screen bg-[#faf9fb]">
      {/* Glassmorphic nav */}
      <nav className="sticky top-0 z-50 bg-[#faf9fb]/80 backdrop-blur-[16px] border-b border-[#cac3d8]/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#4f17ce] to-[#673de6] rounded-xl flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#1b1c1e] text-sm leading-none">Himalayan</p>
                <p className="text-xs text-slate-500 leading-none mt-0.5">Holdings</p>
              </div>
            </Link>
            <Link href="/login" className="text-sm px-4 py-2 bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white rounded-xl">
              Tenant Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/listings" className="flex items-center gap-1 hover:text-[#4f17ce] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Available Properties
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#1b1c1e]">{listing.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: Photos + info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo gallery */}
            {allPhotos.length > 0 ? (
              <div className="space-y-3">
                <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-[#f5f3f5]">
                  <img src={allPhotos[0]} alt={listing.name} className="w-full h-full object-cover" />
                </div>
                {allPhotos.length > 1 && (
                  <div className="grid grid-cols-3 gap-3">
                    {allPhotos.slice(1, 4).map((photo, i) => (
                      <div key={i} className="h-24 rounded-xl overflow-hidden bg-[#f5f3f5]">
                        <img src={photo} alt={`${listing.name} ${i + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-72 rounded-2xl bg-[#f5f3f5] flex items-center justify-center">
                {listing.type === "COMMERCIAL" ? (
                  <Store className="h-20 w-20 text-slate-200" />
                ) : (
                  <Home className="h-20 w-20 text-slate-200" />
                )}
              </div>
            )}

            {/* Property info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${listing.type === "COMMERCIAL" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                  {listing.type === "COMMERCIAL" ? "Commercial" : "Residential"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1b1c1e] mb-3" style={{ letterSpacing: "-0.02em" }}>
                {listing.name}
              </h1>
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                {listing.address}, {listing.city}, {listing.state} {listing.zip}
              </div>
              {listing.description && (
                <p className="mt-5 text-slate-600 leading-[1.5] max-w-xl">{listing.description}</p>
              )}
            </div>

            {/* Available units */}
            <div>
              <h2 className="text-xl font-semibold text-[#1b1c1e] mb-5" style={{ letterSpacing: "-0.01em" }}>
                Available Units
              </h2>
              <div className="space-y-3">
                {listing.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    style={{ boxShadow: "0 40px 40px -10px rgba(27,28,30,0.06)" }}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-[#f5f3f5] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Home className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1b1c1e]">Unit #{unit.unitNumber}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          {unit.bedrooms && (
                            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{unit.bedrooms} bed</span>
                          )}
                          {unit.bathrooms && (
                            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{unit.bathrooms} bath</span>
                          )}
                          {unit.sqft && (
                            <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{unit.sqft.toLocaleString()} sqft</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-[#1b1c1e] text-lg">
                        ${unit.rent.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span>
                      </p>
                      {applyIsExternal ? (
                        <a
                          href={applyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white text-sm font-medium rounded-xl"
                        >
                          Apply on Zillow <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link href={applyHref} className="px-4 py-2 bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white text-sm font-medium rounded-xl">
                          Apply
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Apply CTA sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 sticky top-24" style={{ boxShadow: "0 40px 40px -10px rgba(27,28,30,0.06)" }}>
              <h3 className="font-semibold text-[#1b1c1e] mb-2">
                {listing.units.length} unit{listing.units.length !== 1 ? "s" : ""} available
              </h3>
              <p className="text-2xl font-bold text-[#1b1c1e] mb-1">
                ${Math.min(...listing.units.map((u) => u.rent)).toLocaleString()}
                <span className="text-base font-normal text-slate-400">/mo</span>
              </p>
              <p className="text-sm text-slate-500 mb-6 leading-[1.5]">
                {listing.type === "RESIDENTIAL"
                  ? "Residential applications are processed through Zillow."
                  : "Submit your commercial application and we'll be in touch."}
              </p>
              {applyIsExternal ? (
                <a
                  href={applyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white font-medium rounded-xl"
                >
                  Apply on Zillow <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Link href={applyHref} className="flex items-center justify-center w-full py-3 bg-gradient-to-br from-[#4f17ce] to-[#673de6] text-white font-medium rounded-xl">
                  Start Application
                </Link>
              )}
              <Link href="/listings" className="flex items-center justify-center w-full py-2.5 mt-3 bg-[#e9e8ea] text-[#1b1c1e] text-sm font-medium rounded-xl">
                View All Properties
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

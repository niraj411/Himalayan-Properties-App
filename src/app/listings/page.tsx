import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Building2, Home, Store, MapPin, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getListings() {
  const properties = await db.property.findMany({
    where: { units: { some: { status: "VACANT" } } },
    include: {
      units: {
        where: { status: "VACANT" },
        orderBy: { unitNumber: "asc" },
        select: { id: true, unitNumber: true, bedrooms: true, bathrooms: true, sqft: true, rent: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return properties;
}

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="min-h-screen bg-surface">
      {/* Glassmorphic nav */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-[16px] border-b border-outline-variant/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm leading-none">Himalayan</p>
                <p className="text-xs text-slate-500 leading-none mt-0.5">Properties</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/apply" className="text-sm text-slate-600 hover:text-primary transition-colors">
                Apply
              </Link>
              <Link href="/login" className="text-sm px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl">
                Tenant Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <p className="text-primary font-medium text-sm tracking-wide mb-3">North Denver Metro Area</p>
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface leading-tight" style={{ letterSpacing: "-0.02em" }}>
          Available Properties
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-xl leading-[1.5]">
          Browse our available residential and commercial spaces in Erie, Lafayette, and surrounding communities.
        </p>
      </div>

      {/* Listings */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {listings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl">
            <Building2 className="h-14 w-14 text-slate-200 mx-auto mb-5" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">No Vacancies Right Now</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto leading-[1.5]">
              All units are currently occupied. Submit a general inquiry and we&apos;ll reach out when something becomes available.
            </p>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-medium"
            >
              Submit Inquiry
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const minRent = Math.min(...listing.units.map((u) => u.rent));
              const maxRent = Math.max(...listing.units.map((u) => u.rent));
              const rentRange =
                minRent === maxRent
                  ? `$${minRent.toLocaleString()}/mo`
                  : `$${minRent.toLocaleString()}–$${maxRent.toLocaleString()}/mo`;

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 40px 40px -10px rgba(27,28,30,0.06)" }}
                >
                  {/* Photo */}
                  <div className="relative h-48 bg-surface-container-low">
                    {listing.imageUrl ? (
                      <Image
                        src={listing.imageUrl}
                        alt={listing.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {listing.type === "COMMERCIAL" ? (
                          <Store className="h-14 w-14 text-slate-300" />
                        ) : (
                          <Home className="h-14 w-14 text-slate-300" />
                        )}
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${listing.type === "COMMERCIAL" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"}`}>
                        {listing.type === "COMMERCIAL" ? "Commercial" : "Residential"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-on-surface text-lg leading-tight mb-1" style={{ letterSpacing: "-0.01em" }}>
                      {listing.name}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {listing.address}, {listing.city}, {listing.state}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {listing.units.slice(0, 3).map((unit) => (
                        <span key={unit.id} className="text-xs px-2.5 py-1 bg-surface-container-low rounded-lg text-slate-600">
                          Unit #{unit.unitNumber}
                          {unit.bedrooms ? ` · ${unit.bedrooms}bd` : ""}
                          {unit.bathrooms ? `/${unit.bathrooms}ba` : ""}
                        </span>
                      ))}
                      {listing.units.length > 3 && (
                        <span className="text-xs px-2.5 py-1 bg-surface-container-low rounded-lg text-slate-600">
                          +{listing.units.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">{listing.units.length} available</p>
                        <p className="font-semibold text-on-surface">{rentRange}</p>
                      </div>
                      <Link href={`/listings/${listing.id}`} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

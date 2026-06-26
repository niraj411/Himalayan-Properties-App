import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Building2, Home, Store, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      {/* Navigation (Glassmorphism, No borders) */}
      <nav className="sticky top-0 bg-surface/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-ambient">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-on-surface text-lg leading-none">Himalayan</h1>
                <p className="text-xs text-on-surface/60 leading-none mt-1 tracking-widest uppercase">Properties</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/apply">
                <Button variant="ghost" className="text-primary hover:bg-surface-container-high rounded-xl font-medium">Apply</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium px-6">Tenant Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (Asymmetrical, Oversized Typography) */}
      <section className="relative pt-12 pb-20 px-6 lg:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="w-full md:w-7/12 z-10">
            <p className="text-primary font-semibold mb-4 tracking-widest uppercase text-sm">North Denver Metro Area</p>
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-on-surface tracking-tighter leading-[1.05] mb-6">
              Available Properties
            </h1>
            <p className="text-xl text-on-surface/70 leading-relaxed max-w-lg">
              Browse our curated selection of residential and commercial spaces designed for exceptional living and thriving businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Listings Section (Tonal Layering & Ambient Shadows) */}
      <section className="py-20 px-6 lg:px-12 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto">
          {listings.length === 0 ? (
            <div className="text-center py-24 bg-surface-container-lowest rounded-[2rem] shadow-ambient">
              <div className="w-20 h-20 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-4">No Vacancies Right Now</h2>
              <p className="text-on-surface/70 mb-8 max-w-md mx-auto leading-relaxed text-lg">
                All units are currently occupied. Submit a general inquiry and we&apos;ll reach out when a sanctuary becomes available.
              </p>
              <Link href="/apply">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium">
                  Submit Inquiry
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-ambient transition-all duration-300 hover:bg-surface-bright group flex flex-col"
                  >
                    {/* Photo */}
                    <div className="relative h-56 w-full bg-surface-container-high">
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={listing.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {listing.type === "COMMERCIAL" ? (
                            <Store className="h-16 w-16 text-primary/40" />
                          ) : (
                            <Home className="h-16 w-16 text-primary/40" />
                          )}
                        </div>
                      )}
                      <div className="absolute top-4 left-4 z-10">
                        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-ambient backdrop-blur-md ${listing.type === "COMMERCIAL" ? "bg-surface/90 text-primary" : "bg-surface/90 text-primary"}`}>
                          {listing.type === "COMMERCIAL" ? "Commercial" : "Residential"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="font-bold text-on-surface text-2xl tracking-tight mb-2">
                        {listing.name}
                      </h3>
                      <div className="flex items-center gap-2 text-on-surface/60 text-sm font-medium mb-6">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                        {listing.address}, {listing.city}, {listing.state}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {listing.units.slice(0, 3).map((unit) => (
                          <span key={unit.id} className="text-xs px-3 py-1.5 bg-surface-container-low rounded-lg text-on-surface/80 font-medium">
                            Unit #{unit.unitNumber}
                            {unit.bedrooms ? ` · ${unit.bedrooms}bd` : ""}
                            {unit.bathrooms ? `/${unit.bathrooms}ba` : ""}
                          </span>
                        ))}
                        {listing.units.length > 3 && (
                          <span className="text-xs px-3 py-1.5 bg-surface-container-low rounded-lg text-on-surface/80 font-medium">
                            +{listing.units.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-outline-variant/20">
                        <div>
                          <p className="text-xs text-on-surface/50 font-bold uppercase tracking-wider mb-1">{listing.units.length} available</p>
                          <p className="font-bold text-on-surface text-lg">{rentRange}</p>
                        </div>
                        <Link href={`/listings/${listing.id}`}>
                          <Button variant="ghost" className="text-primary hover:bg-surface-container-high rounded-xl font-medium px-4">
                            Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

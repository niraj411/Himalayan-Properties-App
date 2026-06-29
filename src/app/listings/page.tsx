import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Building2, Home, Store, MapPin, ArrowRight, Languages } from "lucide-react";
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

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const isEs = lang === "es";
  const listings = await getListings();

  // Translations
  const t = {
    title: isEs ? "Himalayan" : "Himalayan",
    subtitle: isEs ? "Propiedades" : "Properties",
    apply: isEs ? "Aplicar" : "Apply",
    tenantSignIn: isEs ? "Portal de Inquilinos" : "Tenant Sign In",
    metroArea: isEs ? "Área Metropolitana del Norte de Denver" : "North Denver Metro Area",
    availableProperties: isEs ? "Propiedades Disponibles" : "Available Properties",
    heroDesc: isEs 
      ? "Explore nuestra selección de espacios residenciales y comerciales diseñados para una vida excepcional y negocios prósperos."
      : "Browse our curated selection of residential and commercial spaces designed for exceptional living and thriving businesses.",
    noVacancies: isEs ? "No hay vacantes en este momento" : "No Vacancies Right Now",
    noVacanciesDesc: isEs 
      ? "Todas las unidades están ocupadas. Envíe una consulta general y nos pondremos en contacto cuando un espacio esté disponible."
      : "All units are currently occupied. Submit a general inquiry and we'll reach out when a sanctuary becomes available.",
    submitInquiry: isEs ? "Enviar Consulta" : "Submit Inquiry",
    commercial: isEs ? "Comercial" : "Commercial",
    residential: isEs ? "Residencial" : "Residential",
    unit: isEs ? "Unidad" : "Unit",
    bed: isEs ? "hab" : "bd",
    bath: isEs ? "baño" : "ba",
    more: isEs ? "más" : "more",
    available: isEs ? "disponibles" : "available",
    details: isEs ? "Detalles" : "Details",
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation (Glassmorphism, No borders) */}
      <nav className="sticky top-0 bg-surface/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href={isEs ? "/?lang=es" : "/"} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-ambient transition-transform hover:scale-105">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-on-surface text-lg leading-none">{t.title}</h1>
                <p className="text-xs text-on-surface/60 leading-none mt-1 tracking-widest uppercase">{t.subtitle}</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={isEs ? "/listings" : "/listings?lang=es"}>
                <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex border-outline-variant/30 text-on-surface/70 hover:text-primary">
                  <Languages className="w-4 h-4 mr-2" />
                  {isEs ? "English" : "Español"}
                </Button>
              </Link>
              <Link href={isEs ? "/apply?lang=es" : "/apply"}>
                <Button variant="ghost" className="text-primary hover:bg-surface-container-high rounded-xl font-medium">{t.apply}</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium px-4 sm:px-6">{t.tenantSignIn}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (Asymmetrical, Oversized Typography) */}
      <section className="relative pt-12 pb-20 px-6 lg:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="w-full md:w-7/12 z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-primary font-semibold tracking-widest uppercase text-sm">{t.metroArea}</p>
              <Link href={isEs ? "/listings" : "/listings?lang=es"} className="sm:hidden">
                <Button variant="outline" size="sm" className="rounded-xl border-outline-variant/30 text-on-surface/70">
                  <Languages className="w-4 h-4 mr-2" />
                  {isEs ? "EN" : "ES"}
                </Button>
              </Link>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-on-surface tracking-tighter leading-[1.05] mb-6">
              {t.availableProperties}
            </h1>
            <p className="text-xl text-on-surface/70 leading-relaxed max-w-lg">
              {t.heroDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Listings Section (Tonal Layering & Ambient Shadows) */}
      <section className="py-20 px-6 lg:px-12 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto">
          {listings.length === 0 ? (
            <div className="text-center py-24 bg-surface-container-lowest rounded-[2rem] shadow-ambient">
              <div className="w-20 h-20 bg-surface-container-high rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-4">{t.noVacancies}</h2>
              <p className="text-on-surface/70 mb-8 max-w-md mx-auto leading-relaxed text-lg">
                {t.noVacanciesDesc}
              </p>
              <Link href={isEs ? "/apply?lang=es" : "/apply"}>
                <Button size="lg" className="h-14 px-8 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium">
                  {t.submitInquiry}
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
                    ? `$${minRent.toLocaleString()}/${isEs ? 'mes' : 'mo'}`
                    : `$${minRent.toLocaleString()}–$${maxRent.toLocaleString()}/${isEs ? 'mes' : 'mo'}`;

                return (
                  <div
                    key={listing.id}
                    className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-ambient transition-all duration-300 hover:bg-surface-bright group flex flex-col hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* Photo */}
                    <div className="relative h-56 w-full bg-surface-container-high overflow-hidden">
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={listing.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center shadow-inner">
                          {listing.type === "COMMERCIAL" ? (
                            <Store className="h-16 w-16 text-primary/40" />
                          ) : (
                            <Home className="h-16 w-16 text-primary/40" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                      <div className="absolute top-4 left-4 z-10">
                        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-ambient backdrop-blur-md bg-surface/90 text-primary">
                          {listing.type === "COMMERCIAL" ? t.commercial : t.residential}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col relative z-10 bg-surface-container-lowest">
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
                            {t.unit} #{unit.unitNumber}
                            {unit.bedrooms ? ` · ${unit.bedrooms}${t.bed}` : ""}
                            {unit.bathrooms ? `/${unit.bathrooms}${t.bath}` : ""}
                          </span>
                        ))}
                        {listing.units.length > 3 && (
                          <span className="text-xs px-3 py-1.5 bg-surface-container-low rounded-lg text-on-surface/80 font-medium">
                            +{listing.units.length - 3} {t.more}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-outline-variant/20">
                        <div>
                          <p className="text-xs text-on-surface/50 font-bold uppercase tracking-wider mb-1">
                            {listing.units.length} {listing.units.length === 1 && isEs ? 'disponible' : t.available}
                          </p>
                          <p className="font-bold text-on-surface text-lg">{rentRange}</p>
                        </div>
                        <Link href={isEs ? `/listings/${listing.id}?lang=es` : `/listings/${listing.id}`}>
                          <Button variant="ghost" className="text-primary hover:bg-surface-container-high rounded-xl font-medium px-4 transition-colors">
                            {t.details}
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

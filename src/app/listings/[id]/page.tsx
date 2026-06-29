import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import PhotoGallery from "./PhotoGallery";

export const dynamic = "force-dynamic";
import {
  Building2, Home, Store, MapPin, ArrowLeft,
  BedDouble, Bath, Maximize2, ExternalLink, ChevronRight, Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default async function ListingDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params;
  const { lang } = await searchParams;
  const isEs = lang === "es";
  const listing = await getListing(id);

  if (!listing) notFound();

  // Translations
  const t = {
    title: isEs ? "Himalayan" : "Himalayan",
    subtitle: isEs ? "Propiedades" : "Properties",
    tenantSignIn: isEs ? "Portal de Inquilinos" : "Tenant Sign In",
    backToAvailable: isEs ? "Volver a Propiedades Disponibles" : "Back to Available Properties",
    notForRent: isEs ? "No disponible para alquiler" : "Not currently for rent",
    fullyLeased: isEs 
      ? `Esta propiedad en ${listing.city}, ${listing.state} está completamente arrendada y no acepta solicitudes en este momento.`
      : `This ${listing.city}, ${listing.state} property is fully leased and not accepting applications at this time.`,
    viewAvailable: isEs ? "Ver Propiedades Disponibles" : "View Available Properties",
    commercial: isEs ? "Comercial" : "Commercial",
    residential: isEs ? "Residencial" : "Residential",
    about: isEs ? "Sobre esta propiedad" : "About this property",
    availableUnits: isEs ? "Unidades Disponibles" : "Available Units",
    unit: isEs ? "Unidad" : "Unit",
    bed: isEs ? "hab" : "bed",
    bath: isEs ? "baño" : "bath",
    sqft: isEs ? "pies²" : "sqft",
    mo: isEs ? "mes" : "mo",
    applyZillow: isEs ? "Aplicar en Zillow" : "Apply on Zillow",
    applyNow: isEs ? "Aplicar Ahora" : "Apply Now",
    available: isEs ? "disponibles" : "available",
    startingPrice: isEs ? "Precio inicial" : "Starting price",
    resAppDesc: isEs 
      ? "Las solicitudes residenciales se procesan de forma segura a través de Zillow."
      : "Residential applications are securely processed and screened through Zillow.",
    comAppDesc: isEs 
      ? "Envíe su solicitud comercial de forma segura y nuestro equipo se comunicará en breve."
      : "Submit your commercial application securely and our team will be in touch shortly.",
    startApp: isEs ? "Comenzar Solicitud" : "Start Application",
    viewAll: isEs ? "Ver Todas las Propiedades" : "View All Properties",
  };

  const applyHref =
    listing.type === "RESIDENTIAL" && listing.zillowUrl
      ? listing.zillowUrl
      : isEs ? `/apply?propertyId=${listing.id}&lang=es` : `/apply?propertyId=${listing.id}`;
  const applyIsExternal = listing.type === "RESIDENTIAL" && !!listing.zillowUrl;

  const allPhotos: string[] = [
    ...(listing.imageUrl ? [listing.imageUrl] : []),
    ...(listing.photos ? JSON.parse(listing.photos) : []),
  ];

  const currentUrl = `/listings/${listing.id}`;

  if (listing.units.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <nav className="sticky top-0 bg-surface/80 backdrop-blur-xl z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between h-20">
              <Link href={isEs ? "/?lang=es" : "/"} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-ambient">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-on-surface text-lg leading-none">{t.title}</h1>
                  <p className="text-xs text-on-surface/60 leading-none mt-1 tracking-widest uppercase">{t.subtitle}</p>
                </div>
              </Link>
              <div className="flex items-center gap-4">
                <Link href={isEs ? currentUrl : `${currentUrl}?lang=es`}>
                  <Button variant="outline" size="sm" className="rounded-xl border-outline-variant/30 text-on-surface/70 hover:text-primary">
                    <Languages className="w-4 h-4 mr-2" />
                    {isEs ? "English" : "Español"}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium px-6">{t.tenantSignIn}</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
          <Link href={isEs ? "/listings?lang=es" : "/listings"} className="inline-flex items-center gap-2 text-sm font-medium text-on-surface/60 hover:text-primary transition-colors mb-12">
            <ArrowLeft className="h-4 w-4" />
            {t.backToAvailable}
          </Link>

          <div className="bg-surface-container-lowest rounded-[2rem] p-12 text-center shadow-ambient max-w-2xl mx-auto border border-outline-variant/10">
            <div className="w-20 h-20 bg-surface-container-high rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              {listing.type === "COMMERCIAL" ? (
                <Store className="h-10 w-10 text-primary/60" />
              ) : (
                <Home className="h-10 w-10 text-primary/60" />
              )}
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl inline-block mb-6 shadow-sm ${listing.type === "COMMERCIAL" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"}`}>
              {listing.type === "COMMERCIAL" ? t.commercial : t.residential}
            </span>
            <h1 className="text-4xl font-bold text-on-surface tracking-tight mb-4">
              {t.notForRent}
            </h1>
            <p className="text-on-surface/70 leading-relaxed text-lg max-w-md mx-auto mb-10">
              {t.fullyLeased}
            </p>
            <Link href={isEs ? "/listings?lang=es" : "/listings"}>
              <Button size="lg" className="h-14 px-8 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium text-base w-full sm:w-auto">
                {t.viewAvailable}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <Link href={isEs ? currentUrl : `${currentUrl}?lang=es`}>
                <Button variant="outline" size="sm" className="rounded-xl border-outline-variant/30 text-on-surface/70 hover:text-primary">
                  <Languages className="w-4 h-4 mr-2" />
                  {isEs ? "English" : "Español"}
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium px-4 sm:px-6">{t.tenantSignIn}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-on-surface/50 mb-10">
          <Link href={isEs ? "/listings?lang=es" : "/listings"} className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t.backToAvailable}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-on-surface/80">{listing.name}</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Photos + Info */}
          <div className="lg:col-span-8 space-y-12 min-w-0">
            
            {/* Gallery */}
            {allPhotos.length > 0 ? (
              <PhotoGallery photos={allPhotos} name={listing.name} />
            ) : (
              <div className="w-full h-80 md:h-[28rem] rounded-[2rem] bg-surface-container-low flex items-center justify-center shadow-inner">
                {listing.type === "COMMERCIAL" ? (
                  <Store className="h-24 w-24 text-primary/20" />
                ) : (
                  <Home className="h-24 w-24 text-primary/20" />
                )}
              </div>
            )}

            {/* Property Info */}
            <div className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm ${listing.type === "COMMERCIAL" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"}`}>
                  {listing.type === "COMMERCIAL" ? t.commercial : t.residential}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tighter mb-4">
                {listing.name}
              </h1>
              <div className="flex items-center gap-2 text-on-surface/70 font-medium text-lg mb-8">
                <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                {listing.address}, {listing.city}, {listing.state} {listing.zip}
              </div>
              
              {listing.description && (
                <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-ambient">
                  <h3 className="font-bold text-on-surface text-xl mb-4">{t.about}</h3>
                  <p className="text-on-surface/70 leading-relaxed text-lg whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}
            </div>

            {/* Units */}
            <div className="pt-4">
              <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-8">
                {t.availableUnits}
              </h2>
              <div className="space-y-6">
                {listing.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-surface-container-lowest rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-ambient transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  >
                    <div className="flex items-start md:items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-surface-container-low to-surface-container-high rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                        <Home className="h-7 w-7 text-primary/70" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-xl mb-2">{t.unit} #{unit.unitNumber}</p>
                        <div className="flex flex-wrap items-center gap-4 text-on-surface/70 font-medium">
                          {unit.bedrooms && (
                            <span className="flex items-center gap-1.5 bg-surface px-3 py-1 rounded-lg"><BedDouble className="h-4 w-4 text-primary" />{unit.bedrooms} {t.bed}</span>
                          )}
                          {unit.bathrooms && (
                            <span className="flex items-center gap-1.5 bg-surface px-3 py-1 rounded-lg"><Bath className="h-4 w-4 text-primary" />{unit.bathrooms} {t.bath}</span>
                          )}
                          {unit.sqft && (
                            <span className="flex items-center gap-1.5 bg-surface px-3 py-1 rounded-lg"><Maximize2 className="h-4 w-4 text-primary" />{unit.sqft.toLocaleString()} {t.sqft}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:gap-2 mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                      <p className="font-bold text-on-surface text-2xl">
                        ${unit.rent.toLocaleString()}<span className="text-base font-medium text-on-surface/50">/{t.mo}</span>
                      </p>
                      {applyIsExternal ? (
                        <a
                          href={applyHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient hover:shadow-2xl transition-all duration-300 border-none font-medium px-6 h-12">
                            {t.applyZillow} <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </a>
                      ) : (
                        <Link href={applyHref}>
                          <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient hover:shadow-2xl transition-all duration-300 border-none font-medium px-8 h-12">
                            {t.applyNow}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: CTA Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 bg-surface/50 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden group">
              {/* Subtle gradient background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse" />
                  <h3 className="font-bold text-on-surface text-lg uppercase tracking-wider">
                    {listing.units.length} {listing.units.length === 1 && isEs ? 'unidad' : isEs ? 'unidades' : 'unit'}{listing.units.length !== 1 && !isEs ? "s" : ""} {t.available}
                  </h3>
                </div>
                
                <p className="text-4xl font-bold text-on-surface tracking-tighter mb-2">
                  ${Math.min(...listing.units.map((u) => u.rent)).toLocaleString()}
                  <span className="text-xl font-medium text-on-surface/50">/{t.mo}</span>
                </p>
                <p className="text-sm font-medium text-primary mb-8 tracking-widest uppercase">{t.startingPrice}</p>
                
                <p className="text-on-surface/70 mb-8 leading-relaxed text-lg">
                  {listing.type === "RESIDENTIAL" ? t.resAppDesc : t.comAppDesc}
                </p>

                {applyIsExternal ? (
                  <a
                    href={applyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none font-semibold text-lg">
                      {t.applyZillow} <ExternalLink className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                ) : (
                  <Link href={applyHref}>
                    <Button size="lg" className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none font-semibold text-lg">
                      {t.startApp}
                    </Button>
                  </Link>
                )}
                
                <Link href={isEs ? "/listings?lang=es" : "/listings"} className="block mt-4">
                  <Button variant="ghost" className="w-full h-12 text-on-surface/70 hover:bg-surface-container-high hover:text-on-surface rounded-xl font-medium transition-colors">
                    {t.viewAll}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

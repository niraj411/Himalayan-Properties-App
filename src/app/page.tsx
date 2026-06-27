import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Home,
  Shield,
  Wrench,
  CreditCard,
  FileText,
  ArrowRight,
  MapPin,
  Store,
  CheckCircle,
  Heart,
  Users,
  Leaf,
  GraduationCap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation (Glassmorphism, No borders) */}
      <nav className="sticky top-0 bg-surface/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-ambient">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-on-surface text-lg">Himalayan</h1>
                <p className="text-xs text-on-surface/60 -mt-1 tracking-widest uppercase">Properties</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#values" className="text-on-surface/80 hover:text-primary transition-colors text-sm font-medium">
                Our Values
              </a>
              <Link href="/listings" className="text-on-surface/80 hover:text-primary transition-colors text-sm font-medium">
                Available Units
              </Link>
              <a href="#tenants" className="text-on-surface/80 hover:text-primary transition-colors text-sm font-medium">
                For Tenants
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/listings">
                <Button variant="ghost" className="text-primary hover:bg-surface-container-high rounded-xl font-medium">Browse Units</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 font-medium px-6">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (Asymmetrical, Oversized Typography) */}
      <section className="relative pt-12 pb-24 px-6 lg:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full lg:w-5/12 z-10 lg:pr-10">
            <p className="text-primary font-semibold mb-6 tracking-widest uppercase text-sm">North Denver Metro Area</p>
            <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-on-surface tracking-tighter leading-[1.05] mb-8">
              Elevating the Standard of Living.
            </h1>
            <p className="text-xl text-on-surface/70 leading-relaxed mb-10 max-w-lg">
              Himalayan Properties curates residential and commercial spaces in Erie, Lafayette, and the North Denver Metro area, blending premium quality with enduring community value.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/listings" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-ambient border-none hover:opacity-90 text-base font-semibold">
                  Browse Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 text-primary hover:bg-surface-container-high rounded-xl text-base font-semibold">
                  Tenant Portal
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Asymmetrical Image Container */}
          <div className="w-full lg:w-7/12 relative mt-8 lg:mt-0">
            <div className="aspect-[4/3] lg:aspect-[4/4] rounded-[2rem] overflow-hidden shadow-ambient relative w-full">
              <Image 
                src="/hero-architecture.jpg" 
                alt="Modern Colorado Architectural Home" 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/20 to-transparent"></div>
            </div>
            {/* Decorative element overlapping */}
            <div className="absolute -bottom-8 -left-8 bg-surface/80 backdrop-blur-2xl p-8 rounded-3xl shadow-ambient hidden md:block max-w-xs z-20">
              <p className="text-on-surface font-medium text-lg leading-snug">&quot;Curating spaces, not just managing data.&quot;</p>
              <p className="text-primary mt-2 font-semibold">— Himalayan Properties</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section (Tonal Layering & Ambient Shadows) */}
      <section id="values" className="py-24 px-6 lg:px-12 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:ml-12 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-6">
              Our Core Philosophy
            </h2>
            <p className="text-lg text-on-surface/70 leading-relaxed">
              We believe the best investments are those that strengthen the communities where we invest. Long-term vision over quick profits.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: Heart,
                title: "Resident-First",
                description: "Prioritizing safe, well-maintained homes and highly responsive service for those who live in them.",
              },
              {
                icon: GraduationCap,
                title: "Education-Forward",
                description: "Strategic investments in areas with premier schools that prepare our residents for success.",
              },
              {
                icon: Users,
                title: "Community Partners",
                description: "Active, engaged members of every single neighborhood where we hold property.",
              },
              {
                icon: Leaf,
                title: "Long-Term Vision",
                description: "Building lasting, generational value over the long term, avoiding short-term flips.",
              }
            ].map((value, idx) => (
              <div key={idx} className="p-8 bg-surface-container-lowest rounded-[1.5rem] shadow-ambient transition-all duration-300 hover:bg-surface-bright hover:-translate-y-1">
                <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center mb-6">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{value.title}</h3>
                <p className="text-on-surface/70 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties Section (No Divider Lines, Tonal Hierarchy) */}
      <section id="properties" className="py-24 px-6 lg:px-12 bg-surface relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-6">
              Our Portfolio
            </h2>
            <p className="text-lg text-on-surface/70 max-w-2xl mx-auto">
              Curated residential and commercial properties across the North Denver Metro area, designed for exceptional living and thriving businesses.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Residential */}
            <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-ambient transition-all duration-300 hover:bg-surface-bright group flex flex-col">
              <div className="relative h-64 w-full">
                <Image src="/residential.jpg" alt="Residential Property" fill className="object-cover" />
              </div>
              <div className="p-10 md:p-12 flex-1 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center mb-8 shadow-ambient group-hover:scale-105 transition-transform absolute -top-8 left-10">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <div className="pt-4">
                  <h3 className="text-3xl font-bold text-on-surface tracking-tight mb-6">Residential Sanctuaries</h3>
                  <p className="text-on-surface/70 text-lg mb-10 leading-relaxed">
                    Single-family homes and multi-unit properties in desirable neighborhoods, offering access to top-rated schools and a profound sense of community.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <MapPin className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-on-surface/80 font-medium">Erie, Lafayette, and surrounding areas</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <CheckCircle className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-on-surface/80 font-medium">Immaculately maintained properties</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <Shield className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-on-surface/80 font-medium">Safe, established, and welcoming neighborhoods</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial */}
            <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-ambient transition-all duration-300 hover:bg-surface-bright group flex flex-col">
              <div className="relative h-64 w-full">
                <Image src="/commercial.jpg" alt="Commercial Property" fill className="object-cover" />
              </div>
              <div className="p-10 md:p-12 flex-1 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center mb-8 shadow-ambient group-hover:scale-105 transition-transform absolute -top-8 left-10">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div className="pt-4">
                  <h3 className="text-3xl font-bold text-on-surface tracking-tight mb-6">Commercial Spaces</h3>
                  <p className="text-on-surface/70 text-lg mb-10 leading-relaxed">
                    Premium retail and office environments carefully selected for businesses that serve, elevate, and enhance our local communities.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <CheckCircle className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-on-surface/80 font-medium">Healthcare and medical office suites</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <CheckCircle className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-on-surface/80 font-medium">Educational and professional tutoring centers</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <CheckCircle className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-on-surface/80 font-medium">Independent and boutique local businesses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Features (Layered on low container) */}
      <section id="tenants" className="py-24 px-6 lg:px-12 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:ml-12 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-6">
              Seamless Tenant Experience
            </h2>
            <p className="text-lg text-on-surface/70 leading-relaxed">
              Powerful, intuitive online tools to effortlessly manage every aspect of your rental experience from any device.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Wrench,
                title: "Maintenance",
                description: "Submit, track, and manage maintenance requests online with real-time status updates.",
              },
              {
                icon: CreditCard,
                title: "Payments",
                description: "View detailed payment history, upcoming charges, and securely manage your rent.",
              },
              {
                icon: FileText,
                title: "Documents",
                description: "Secure, 24/7 access to your lease, insurance certificates, and important documents.",
              },
              {
                icon: Shield,
                title: "Security",
                description: "Enterprise-grade protection ensuring your personal and financial information remains private.",
              },
              {
                icon: Building2,
                title: "Property Hub",
                description: "Stay informed with real-time property announcements, notices, and community updates.",
              },
              {
                icon: Home,
                title: "Always On",
                description: "Full control over your rental experience, anytime, anywhere, on any modern device.",
              },
            ].map((feature) => (
              <div key={feature.title} className="p-8 rounded-[1.5rem] bg-surface-container-lowest shadow-ambient transition-all duration-300 hover:bg-surface-bright">
                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">
                  {feature.title}
                </h3>
                <p className="text-on-surface/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Gradient CTA */}
      <section className="py-24 px-6 lg:px-12 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2.5rem] p-12 md:p-20 text-center shadow-ambient relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">
                Ready to find your sanctuary?
              </h2>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                Browse our curated selection of available units and submit your application entirely online today.
              </p>
              <Link href="/listings">
                <Button size="lg" className="h-16 px-10 bg-surface-container-lowest text-primary hover:bg-surface rounded-2xl text-lg font-bold shadow-ambient border-none transition-all hover:scale-105">
                  View Available Units
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Elevated, Quiet) */}
      <footer className="py-16 px-6 lg:px-12 bg-surface-container-highest">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-ambient">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-on-surface text-xl">Himalayan Properties</span>
              </div>
              <p className="text-on-surface/70 text-base leading-relaxed max-w-sm">
                Elevated property management curating exceptional residential and commercial spaces across the North Denver Metro Area.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-6 uppercase tracking-widest text-sm">Navigation</h3>
              <div className="space-y-4">
                <Link href="/listings" className="block text-on-surface/70 hover:text-primary font-medium transition-colors">
                  Available Units
                </Link>
                <Link href="/apply" className="block text-on-surface/70 hover:text-primary font-medium transition-colors">
                  Apply for Housing
                </Link>
                <Link href="/login" className="block text-on-surface/70 hover:text-primary font-medium transition-colors">
                  Tenant Portal
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-6 uppercase tracking-widest text-sm">Service Areas</h3>
              <p className="text-on-surface/70 leading-relaxed font-medium">
                Erie, Colorado<br />
                Lafayette, Colorado<br />
                North Denver Metro Area
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-on-surface/60 font-medium">
              &copy; {new Date().getFullYear()} Himalayan Properties. All rights reserved.
            </p>
            <p className="text-on-surface/60 font-medium">
              himalayanprop.cloud
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

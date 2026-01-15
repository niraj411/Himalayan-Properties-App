import Link from "next/link";
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Himalayan</h1>
                <p className="text-xs text-slate-500 -mt-1">Holdings</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#values" className="text-slate-600 hover:text-slate-900 text-sm">
                Our Values
              </a>
              <a href="#properties" className="text-slate-600 hover:text-slate-900 text-sm">
                Properties
              </a>
              <a href="#tenants" className="text-slate-600 hover:text-slate-900 text-sm">
                For Tenants
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/apply">
                <Button variant="ghost" size="sm">Apply</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-blue-600 font-medium mb-3 text-sm">North Denver Metro Area</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Building Community Through
            <span className="text-blue-600"> Quality Real Estate</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Himalayan Holdings is a family-owned investment firm focused on residential and
            commercial properties in Erie, Lafayette, and the North Denver Metro area.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/apply">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-11 px-6">
                Apply for a Property
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-6">
                Tenant Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Our Values
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              We believe the best investments are those that strengthen the communities where we invest.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 bg-blue-50 rounded-xl">
              <Heart className="h-7 w-7 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Family-Focused</h3>
              <p className="text-sm text-slate-600">
                Strong families build strong communities. We prioritize housing that supports family life.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl">
              <GraduationCap className="h-7 w-7 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Education-Forward</h3>
              <p className="text-sm text-slate-600">
                We invest in areas with excellent schools that prepare residents for success.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl">
              <Users className="h-7 w-7 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Community Partners</h3>
              <p className="text-sm text-slate-600">
                We are active members of every neighborhood where we own property.
              </p>
            </div>
            <div className="p-5 bg-blue-50 rounded-xl">
              <Leaf className="h-7 w-7 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Long-Term Vision</h3>
              <p className="text-sm text-slate-600">
                We build lasting value that benefits future generations, not quick profits.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-slate-900 rounded-xl text-center">
            <p className="text-lg text-white font-medium max-w-2xl mx-auto">
              &ldquo;When communities thrive, property values strengthen. When families have
              access to quality housing near good schools, neighborhoods flourish.&rdquo;
            </p>
            <p className="text-slate-400 text-sm mt-3">— Himalayan Holdings</p>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Our Properties
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Residential and commercial properties across the North Denver Metro area.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Residential */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Residential</h3>
              <p className="text-slate-600 text-sm mb-4">
                Single-family homes and multi-unit properties in desirable neighborhoods
                with access to top-rated schools.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Erie, Lafayette, and surrounding areas
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  Well-maintained properties
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Safe, family-friendly neighborhoods
                </li>
              </ul>
            </div>

            {/* Commercial */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Commercial</h3>
              <p className="text-slate-600 text-sm mb-4">
                Retail and office spaces for businesses that serve and enhance our communities.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  Healthcare and medical offices
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  Educational and tutoring centers
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  Local and family-owned businesses
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Features */}
      <section id="tenants" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              For Our Tenants
            </h2>
            <p className="text-slate-600">
              Online tools to manage your rental experience
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Wrench,
                title: "Maintenance Requests",
                description: "Submit and track maintenance requests online.",
              },
              {
                icon: CreditCard,
                title: "Payment Info",
                description: "View payment details and history.",
              },
              {
                icon: FileText,
                title: "Lease Documents",
                description: "Access your lease anytime.",
              },
              {
                icon: Shield,
                title: "Secure Portal",
                description: "Your information is protected.",
              },
              {
                icon: Building2,
                title: "Property Updates",
                description: "Stay informed about your property.",
              },
              {
                icon: Home,
                title: "24/7 Access",
                description: "Manage your rental anytime, anywhere.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl bg-slate-50"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Looking for a Property?
          </h2>
          <p className="text-blue-100 mb-6">
            Browse available properties and submit your application online.
          </p>
          <Link href="/apply">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 h-11 px-6"
            >
              Apply Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Himalayan Holdings</span>
              </div>
              <p className="text-slate-400 text-sm">
                Family-owned property management in the North Denver Metro Area.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                himalayanprop.cloud
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Links</h3>
              <div className="space-y-2">
                <Link href="/apply" className="block text-slate-400 hover:text-white text-sm">
                  Apply for Housing
                </Link>
                <Link href="/login" className="block text-slate-400 hover:text-white text-sm">
                  Tenant Portal
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Service Areas</h3>
              <p className="text-slate-400 text-sm">
                Erie, CO • Lafayette, CO<br />
                North Denver Metro
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Himalayan Holdings. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

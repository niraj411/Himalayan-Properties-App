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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Himalayan</h1>
                <p className="text-xs text-slate-500 -mt-1">Properties</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/apply">
                <Button variant="ghost">Apply Now</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
            Professional Property
            <span className="text-blue-600"> Management</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Quality residential and commercial properties managed with care.
            Your perfect space is waiting.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
                Apply for a Property
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Tenant Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Our tenant portal makes managing your rental experience simple
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Quality Properties",
                description:
                  "Well-maintained residential and commercial properties in great locations.",
              },
              {
                icon: Wrench,
                title: "Easy Maintenance",
                description:
                  "Submit maintenance requests online and track their progress in real-time.",
              },
              {
                icon: CreditCard,
                title: "Simple Payments",
                description:
                  "Multiple payment options with clear information and payment history.",
              },
              {
                icon: FileText,
                title: "Digital Leases",
                description:
                  "Access your lease documents anytime through your tenant portal.",
              },
              {
                icon: Shield,
                title: "Secure Portal",
                description:
                  "Your information is protected with industry-standard security.",
              },
              {
                icon: Building2,
                title: "Professional Management",
                description:
                  "Dedicated property management team ready to assist you.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find Your New Home?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Submit your application today and take the first step toward your new space.
          </p>
          <Link href="/apply">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8"
            >
              Start Your Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Himalayan Properties</h1>
                <p className="text-xs text-slate-400">Property Management</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                Tenant Login
              </Link>
              <Link href="/apply" className="text-slate-400 hover:text-white transition-colors">
                Apply
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Himalayan Properties. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Designed by Himalaya LLC | <a href="https://rajgautam.com" className="hover:text-slate-400">rajgautam.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  KeyRound,
  Wallet,
  Megaphone,
  Home,
  Users,
  FileText,
  ClipboardList,
  Shield,
  BarChart3,
  CreditCard,
  Calculator,
  Wrench,
  Mail,
  Settings,
  Plug,
  User,
  LifeBuoy,
  Receipt,
  Bell,
} from "lucide-react";

// Declarative information architecture for both portals. The SidebarNav engine
// renders this: multi-item groups become expandable categories (collapse to an
// icon rail with a flyout); single-item groups render as a direct link; `footer`
// items pin to the bottom (Settings / Profile).

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean; // index routes (/admin, /dashboard) match exactly
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon; // category icon (the "menu" icon)
  items: NavItem[];
};

export type NavConfig = {
  brand: { title: string; subtitle: string; href: string };
  groups: NavGroup[];
  footer: NavItem[];
};

export const adminNavConfig: NavConfig = {
  brand: { title: "Himalayan", subtitle: "Properties", href: "/admin" },
  groups: [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true }],
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Building2,
      items: [{ name: "Properties", href: "/admin/properties", icon: Home }],
    },
    {
      id: "leasing",
      label: "Leasing",
      icon: KeyRound,
      items: [
        { name: "Tenants", href: "/admin/tenants", icon: Users },
        { name: "Leases", href: "/admin/leases", icon: FileText },
        { name: "Applications", href: "/admin/applications", icon: ClipboardList },
        { name: "Insurance", href: "/admin/insurance", icon: Shield },
      ],
    },
    {
      id: "financials",
      label: "Financials",
      icon: Wallet,
      items: [
        { name: "Rent Roll", href: "/admin/rent-roll", icon: BarChart3 },
        { name: "Payments", href: "/admin/payments", icon: CreditCard },
        { name: "Outstanding", href: "/admin/charges", icon: Receipt },
        { name: "Accounting", href: "/admin/accounting", icon: Calculator },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      icon: Megaphone,
      items: [
        { name: "Maintenance", href: "/admin/maintenance", icon: Wrench },
        { name: "Notices", href: "/admin/notices", icon: Bell },
        { name: "Messages", href: "/admin/messages", icon: Mail },
      ],
    },
  ],
  footer: [{ name: "Settings", href: "/admin/settings", icon: Settings }],
};

export const tenantNavConfig: NavConfig = {
  brand: { title: "Himalayan", subtitle: "Tenant Portal", href: "/dashboard" },
  groups: [
    {
      id: "home",
      label: "Home",
      icon: LayoutDashboard,
      items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true }],
    },
    {
      id: "my-home",
      label: "My Home",
      icon: Home,
      items: [
        { name: "My Lease", href: "/dashboard/lease", icon: FileText },
        { name: "Utilities", href: "/dashboard/utilities", icon: Plug },
      ],
    },
    {
      id: "money",
      label: "Money",
      icon: Wallet,
      items: [{ name: "Payments", href: "/dashboard/payments", icon: CreditCard }],
    },
    {
      id: "requests",
      label: "Requests",
      icon: LifeBuoy,
      items: [{ name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench }],
    },
  ],
  footer: [{ name: "Profile", href: "/dashboard/profile", icon: User }],
};

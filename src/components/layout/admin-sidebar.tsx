"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { adminNavConfig } from "@/components/layout/nav-config";

// Thin wrapper — the actual navigation lives in the shared SidebarNav engine,
// driven by adminNavConfig. Export name preserved for the layout/callers.
export function AdminSidebar() {
  return <SidebarNav config={adminNavConfig} />;
}

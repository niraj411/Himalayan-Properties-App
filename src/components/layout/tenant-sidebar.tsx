"use client";

import { useSession } from "next-auth/react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { tenantNavConfig } from "@/components/layout/nav-config";

// Thin wrapper — shared SidebarNav engine driven by tenantNavConfig, plus the
// signed-in tenant's name/email as the userSlot under the brand.
export function TenantSidebar() {
  const { data: session } = useSession();
  return (
    <SidebarNav
      config={tenantNavConfig}
      userSlot={
        <div className="rounded-xl bg-surface-container-low px-3 py-2.5">
          <p className="truncate text-sm font-medium text-on-surface">{session?.user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
        </div>
      }
    />
  );
}

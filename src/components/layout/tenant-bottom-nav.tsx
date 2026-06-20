"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { isItemActive, isGroupActive } from "@/lib/nav";
import { tenantNavConfig, type NavGroup } from "@/components/layout/nav-config";

// Mobile-only bottom tab bar for the tenant portal (native-feel nav). Each
// top-level category is a tab: single-item categories link directly; multi-item
// categories open a bottom Sheet of their items. Profile (footer) is a tab too.
// Hidden on lg+, where the sidebar takes over. Glassmorphism + safe-area inset.
export function TenantBottomNav() {
  const pathname = usePathname();
  const tabs = tenantNavConfig.groups;
  const profile = tenantNavConfig.footer[0];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-outline-variant/15 bg-surface/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {tabs.map((group) =>
        group.items.length === 1 ? (
          <TabLink
            key={group.id}
            href={group.items[0].href}
            label={group.items[0].name}
            Icon={group.icon}
            active={isItemActive(pathname, group.items[0].href, group.items[0].exact)}
          />
        ) : (
          <GroupTab key={group.id} group={group} active={isGroupActive(pathname, group)} pathname={pathname} />
        )
      )}
      <TabLink
        href={profile.href}
        label={profile.name}
        Icon={profile.icon}
        active={isItemActive(pathname, profile.href, profile.exact)}
      />
    </nav>
  );
}

function tabClasses(active: boolean) {
  return cn(
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
    active ? "text-primary" : "text-muted-foreground"
  );
}

function TabLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link href={href} className={tabClasses(active)} aria-current={active ? "page" : undefined}>
      <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/10")}>
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </Link>
  );
}

function GroupTab({ group, active, pathname }: { group: NavGroup; active: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={tabClasses(active)} aria-label={group.label}>
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/10")}>
          <group.icon className="h-5 w-5" />
        </span>
        {group.label}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl bg-surface/95 backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetTitle className="px-1 text-base">{group.label}</SheetTitle>
        <ul className="mt-4 space-y-1">
          {group.items.map((item) => {
            const itemActive = isItemActive(pathname, item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    itemActive ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"
                  )}
                  aria-current={itemActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

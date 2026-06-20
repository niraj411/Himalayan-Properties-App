"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { Building2, ChevronLeft, ChevronDown, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { isItemActive, isGroupActive, findActiveGroupId } from "@/lib/nav";
import type { NavConfig, NavGroup, NavItem } from "@/components/layout/nav-config";

const COLLAPSE_KEY = "hp-nav-collapsed";

// Shared icon-led navigation for both portals. Expanded: category headers that
// reveal their items (single-item groups render as a direct link). Collapsed:
// a slim icon rail where multi-item categories open a flyout. Mobile: a Sheet
// drawer with the fully-expanded list. Elevated Sanctuary tokens throughout —
// glassmorphism, tonal active state (violet tint, no borders, no blue).
export function SidebarNav({
  config,
  userSlot,
}: {
  config: NavConfig;
  userSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(findActiveGroupId(pathname, config.groups) ? [findActiveGroupId(pathname, config.groups)!] : [])
  );

  // Restore collapse preference after mount (avoid SSR hydration mismatch).
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "1") {
      setCollapsed(true);
    }
  }, []);

  // Keep the active group expanded as the route changes.
  useEffect(() => {
    const id = findActiveGroupId(pathname, config.groups);
    if (id) setOpenGroups((prev) => new Set(prev).add(id));
  }, [pathname, config.groups]);

  // Drive the content offset (layout <main> reads --sidebar-w with a 16rem fallback).
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "5rem" : "16rem");
  }, [mounted, collapsed]);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const leafClasses = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-surface-container-low hover:text-on-surface"
    );

  // ---- expanded-mode rendering (sidebar + mobile sheet) ----
  function renderExpanded(forceOpen = false, onNavigate?: () => void) {
    return (
      <ul className="space-y-1 px-3">
        {config.groups.map((group) => {
          if (group.items.length === 1) {
            const item = group.items[0];
            const active = isItemActive(pathname, item.href, item.exact);
            return (
              <li key={group.id}>
                <Link href={item.href} onClick={onNavigate} className={leafClasses(active)} aria-current={active ? "page" : undefined}>
                  <group.icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          }
          const groupActive = isGroupActive(pathname, group);
          const open = forceOpen || openGroups.has(group.id);
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={open}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  groupActive ? "text-on-surface" : "text-muted-foreground hover:text-on-surface hover:bg-surface-container-low"
                )}
              >
                <group.icon className={cn("h-5 w-5 shrink-0", groupActive && "text-primary")} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <ul className="mt-1 space-y-1 pl-4">
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.href, item.exact);
                    return (
                      <li key={item.href}>
                        <Link href={item.href} onClick={onNavigate} className={leafClasses(active)} aria-current={active ? "page" : undefined}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  // ---- collapsed-mode rendering (icon rail with flyouts) ----
  function renderRail() {
    return (
      <ul className="space-y-1 px-2">
        {config.groups.map((group) => {
          const groupActive = isGroupActive(pathname, group);
          if (group.items.length === 1) {
            const item = group.items[0];
            const active = isItemActive(pathname, item.href, item.exact);
            return (
              <li key={group.id}>
                <RailTooltip label={item.name}>
                  <Link href={item.href} aria-label={item.name} aria-current={active ? "page" : undefined} className={railIconClasses(active)}>
                    <group.icon className="h-5 w-5" />
                  </Link>
                </RailTooltip>
              </li>
            );
          }
          return (
            <li key={group.id}>
              <DropdownMenu>
                <RailTooltip label={group.label}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label={group.label} className={railIconClasses(groupActive)}>
                      <group.icon className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                </RailTooltip>
                <DropdownMenuContent side="right" align="start" className="min-w-48">
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.href, item.exact);
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className={cn("gap-2", active && "text-primary")}>
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    );
  }

  const railIconClasses = (active: boolean) =>
    cn(
      "flex h-11 w-11 items-center justify-center rounded-xl transition-colors mx-auto",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-container-low hover:text-on-surface"
    );

  function brand(showText: boolean) {
    return (
      <Link href={config.brand.href} className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        {showText && (
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-on-surface">{config.brand.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{config.brand.subtitle}</p>
          </div>
        )}
      </Link>
    );
  }

  function signOutButton(showText: boolean) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className={cn(
          "flex items-center rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-on-surface",
          showText ? "w-full gap-3 px-3 py-2.5" : "h-11 w-11 mx-auto justify-center"
        )}
        aria-label="Sign out"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {showText && <span>Sign Out</span>}
      </button>
    );
  }

  function footerLinks(showText: boolean) {
    return config.footer.map((item: NavItem) => {
      const active = isItemActive(pathname, item.href, item.exact);
      return showText ? (
        <Link key={item.href} href={item.href} className={leafClasses(active)} aria-current={active ? "page" : undefined}>
          <item.icon className="h-5 w-5 shrink-0" />
          <span>{item.name}</span>
        </Link>
      ) : (
        <RailTooltip key={item.href} label={item.name}>
          <Link href={item.href} aria-label={item.name} aria-current={active ? "page" : undefined} className={railIconClasses(active)}>
            <item.icon className="h-5 w-5" />
          </Link>
        </RailTooltip>
      );
    });
  }

  return (
    <TooltipProvider delayDuration={150}>
      {/* Mobile trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-surface/95 backdrop-blur-xl">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-4">{brand(true)}</div>
            {userSlot && <div className="px-4 pb-4">{userSlot}</div>}
            <nav className="flex-1 overflow-y-auto py-2">{renderExpanded(true, () => setMobileOpen(false))}</nav>
            <div className="space-y-1 p-3">
              {footerLinks(true)}
              {signOutButton(true)}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-surface/80 backdrop-blur-xl shadow-ambient transition-[width] duration-300 lg:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center", collapsed ? "justify-center px-2" : "px-4")}>
          {!collapsed && brand(true)}
          {collapsed && brand(false)}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleCollapse} aria-label="Collapse navigation">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!collapsed && userSlot && <div className="px-4 pb-4">{userSlot}</div>}

        <nav className="flex-1 overflow-y-auto py-2">{collapsed ? renderRail() : renderExpanded()}</nav>

        <div className="space-y-1 p-3">
          {footerLinks(!collapsed)}
          {signOutButton(!collapsed)}
          {collapsed && (
            <Button variant="ghost" size="icon" className="mx-auto flex" onClick={toggleCollapse} aria-label="Expand navigation">
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

function RailTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

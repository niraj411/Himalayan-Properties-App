// Pure navigation helpers — SSR-safe, no client APIs, unit-testable.
// Shared by the sidebar engine and the tenant bottom nav.

import type { NavGroup } from "@/components/layout/nav-config";

// Is `href` the active route for the current pathname?
// exact -> only an exact match (index routes like /admin, /dashboard).
// otherwise -> exact OR a true sub-path. We match `href + "/"` (not a bare
// startsWith) so "/admin/lease" does NOT light up "/admin/leases".
export function isItemActive(pathname: string, href: string, exact = false): boolean {
  if (pathname === href) return true;
  if (exact) return false;
  return pathname.startsWith(href + "/");
}

// A group is "active" if any of its items is the active route.
export function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((i) => isItemActive(pathname, i.href, i.exact));
}

// The id of the group containing the active route (for auto-expand), or null.
export function findActiveGroupId(pathname: string, groups: NavGroup[]): string | null {
  const g = groups.find((grp) => isGroupActive(pathname, grp));
  return g?.id ?? null;
}

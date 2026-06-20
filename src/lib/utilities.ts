// Shared utility-type constants + labels. Pure module (no React/Prisma) so it can
// be imported by API routes, the admin section, and the tenant page alike.

export const UTILITY_TYPES = [
  "TRASH",
  "ELECTRIC",
  "WATER",
  "SEWER",
  "GAS",
  "HOA",
  "INTERNET",
  "OTHER",
] as const;

export type UtilityType = (typeof UTILITY_TYPES)[number];

export const UTILITY_TYPE_LABELS: Record<string, string> = {
  TRASH: "Trash & Recycling",
  ELECTRIC: "Electricity",
  WATER: "Water",
  SEWER: "Sewer",
  GAS: "Gas",
  HOA: "HOA",
  INTERNET: "Internet",
  OTHER: "Other",
};

export function utilityTypeLabel(type: string): string {
  return UTILITY_TYPE_LABELS[type] ?? type;
}

// Fields that are safe to return to tenants. Everything else on the Utility model
// (accountNumber, monthlyCost, dueDay, internalNotes) is ADMIN-ONLY.
export const TENANT_UTILITY_SELECT = {
  id: true,
  type: true,
  providerName: true,
  phone: true,
  website: true,
  tenantNotes: true,
} as const;

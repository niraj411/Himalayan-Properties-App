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

// ---------------------------------------------------------------------------
// Utility bills (ADMIN-ONLY). A UtilityBill is one provider statement for a
// Utility row, e.g. an Xcel monthly bill. Nothing here is ever sent to tenants.
// ---------------------------------------------------------------------------

export const BILL_SOURCES = ["MANUAL", "AGENT", "IMPORT"] as const;
export type BillSource = (typeof BILL_SOURCES)[number];

export const BILL_PAYMENT_METHODS = ["AUTOPAY", "CARD", "ACH", "CHECK", "OTHER"] as const;

export type BillStatus = "PAID" | "OVERDUE" | "DUE_SOON" | "DUE";

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  PAID: "Paid",
  OVERDUE: "Overdue",
  DUE_SOON: "Due soon",
  DUE: "Open",
};

// Shape shared by API responses and the admin UI.
export interface UtilityBillDTO {
  id: string;
  utilityId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  amount: number;
  kwh: number | null;
  therms: number | null;
  gallons: number | null;
  paidAt: string | null;
  paymentMethod: string | null;
  documentUrl: string | null;
  source: string;
  externalId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  utility?: {
    id: string;
    type: string;
    providerName: string;
    propertyId: string;
    unitId: string | null;
    accountNumber?: string | null;
    property?: { id: string; name: string };
    unit?: { id: string; unitNumber: string } | null;
  };
}

// Date-only strings ("2026-09-01") are stored as UTC midnight (same as
// `new Date("2026-09-01")`) and must be formatted back in UTC so they do not
// slide a day in Denver. Returns null for empty input, throws on garbage.
export function parseDateOnly(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date "${s}"`);
  return d;
}

export function formatBillDate(value: string | Date | null | undefined, opts?: { year?: boolean }): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(opts?.year === false ? {} : { year: "numeric" }),
  });
}

// "Aug 12 to Sep 11, 2026" (no dashes, per house style).
export function formatBillPeriod(start: string | Date, end: string | Date): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  return `${formatBillDate(s, { year: !sameYear })} to ${formatBillDate(e)}`;
}

// "YYYY-MM-DD" for <input type="date"> round-trips.
export function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function billStatus(
  bill: { paidAt: string | Date | null; dueDate: string | Date | null },
  now: Date = new Date(),
  dueSoonDays = 7
): BillStatus {
  if (bill.paidAt) return "PAID";
  if (!bill.dueDate) return "DUE";
  const due = typeof bill.dueDate === "string" ? new Date(bill.dueDate) : bill.dueDate;
  const msPerDay = 86_400_000;
  const daysLeft = Math.floor((due.getTime() - now.getTime()) / msPerDay);
  if (daysLeft < 0) return "OVERDUE";
  if (daysLeft <= dueSoonDays) return "DUE_SOON";
  return "DUE";
}

export function usageSummary(bill: { kwh: number | null; therms: number | null; gallons: number | null }): string {
  const parts: string[] = [];
  if (bill.kwh != null) parts.push(`${Math.round(bill.kwh).toLocaleString("en-US")} kWh`);
  if (bill.therms != null) parts.push(`${Math.round(bill.therms).toLocaleString("en-US")} therms`);
  if (bill.gallons != null) parts.push(`${Math.round(bill.gallons).toLocaleString("en-US")} gal`);
  return parts.join(" / ");
}

// Optional-number form field -> Float | null (throws on garbage so the API can 400).
export function parseOptionalNumber(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (Number.isNaN(n)) throw new Error(`${label} must be a number`);
  return n;
}

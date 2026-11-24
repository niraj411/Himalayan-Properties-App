// Monthly rent statement: what a tenant owes on the 1st of a given month
// (that month's rent, base + NNN, plus the open charges that count toward it),
// posted to the tenant's Notices page as a STATEMENT notice. Portal-only by
// default (status POSTED); Admin > Notices "Email now" sends that same row later.
// Shared by the admin route and the trusted agent API so both write the same
// viewable record.
import { db } from "@/lib/db";
import { chargeRemaining, round2 } from "@/lib/ledger";
import { usd } from "@/lib/commercial";
import { COMMON_AREA_STATUS } from "@/lib/units";

export interface StatementCharge {
  id: string;
  label: string;
  amount: number;
  amountPaid: number;
  status: string;
  dueDate: Date | null;
}

export interface MonthlyStatement {
  leaseId: string;
  tenantName: string;
  toEmail: string;
  premises: string;
  periodLabel: string; // "December 2026"
  dueDate: Date; // 1st of the period, UTC
  base: number;
  nnn: number;
  rent: number; // base + nnn
  charges: { label: string; remaining: number; dueDate: Date | null }[];
  totalDue: number;
  subject: string;
  body: string;
}

/** "2026-12" -> 1st of that month at 12:00 UTC (noon keeps it on the same day in every US zone). */
export function parsePeriod(period: string): Date {
  const m = /^(\d{4})-(\d{2})$/.exec(period?.trim() ?? "");
  if (!m) throw new Error(`period must look like 2026-12 (got "${period}")`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1, 12));
}

const dayFmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Which open charges belong on the statement for the period starting `periodStart`.
 * Only OPEN charges with something left to pay are passed in.
 */
export function chargesForPeriod(open: StatementCharge[], periodStart: Date): StatementCharge[] {
  // Due on or before the 1st (or undated = due now). Later-dated charges stay off
  // this month's "Total due" but remain on the full account statement PDF.
  return open.filter((c) => !c.dueDate || c.dueDate.getTime() <= periodStart.getTime());
}

/** Base rent in effect on `on`: the lease's rent, or a later scheduled step-up that has kicked in. */
async function baseRentOn(leaseId: string, current: number, on: Date): Promise<number> {
  const step = await db.leaseEscalation.findFirst({
    where: { leaseId, applied: false, effectiveDate: { lte: on } },
    orderBy: { effectiveDate: "desc" },
  });
  return step ? step.newMonthlyRent : current;
}

export async function buildMonthlyStatement(leaseId: string, period: string): Promise<MonthlyStatement> {
  const dueDate = parsePeriod(period);
  const lease = await db.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: { include: { user: true } },
      unit: { include: { property: true } },
      charges: { where: { status: "OPEN" }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!lease) throw new Error(`No lease with id ${leaseId}.`);

  const base = round2(await baseRentOn(lease.id, lease.monthlyRent, dueDate));
  const nnn = round2(lease.nnnMonthly ?? 0);
  const rent = round2(base + nnn);

  const open = lease.charges.filter((c) => chargeRemaining(c) > 0);
  const charges = chargesForPeriod(open, dueDate).map((c) => ({
    label: c.label,
    remaining: chargeRemaining(c),
    dueDate: c.dueDate,
  }));
  const totalDue = round2(rent + charges.reduce((s, c) => s + c.remaining, 0));

  const p = lease.unit.property;
  const premises = `${p.address}, Unit ${lease.unit.unitNumber}`;
  const periodLabel = dueDate.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  const rentLines = nnn > 0
    ? [`Base rent: ${usd(base)}`, `NNN / CAM: ${usd(nnn)}`, `${periodLabel} rent: ${usd(rent)}`]
    : [`${periodLabel} rent: ${usd(rent)}`];
  const chargeLines = charges.length
    ? ["", "Other open items:", ...charges.map((c) => `${c.label}: ${usd(c.remaining)}${c.dueDate ? ` (due ${dayFmt(c.dueDate)})` : ""}`)]
    : [];

  const body = [
    `Hi ${lease.tenant.user.name},`,
    "",
    `Here is your statement for ${periodLabel} at ${premises}.`,
    "",
    ...rentLines,
    ...chargeLines,
    "",
    `Total due ${dayFmt(dueDate)}: ${usd(totalDue)}`,
    "",
    "You can download the full account statement (every charge and payment on file) from the Balance page in your tenant portal. If anything looks off, just reply and let me know.",
    "",
    "Thanks,",
    "Himalayan Holding Property LLC",
  ].join("\n");

  return {
    leaseId: lease.id,
    tenantName: lease.tenant.user.name,
    toEmail: lease.tenant.user.email,
    premises,
    periodLabel,
    dueDate,
    base,
    nnn,
    rent,
    charges,
    totalDue,
    subject: `${periodLabel} rent statement, ${premises}`,
    body,
  };
}

/**
 * Post the statement as a STATEMENT notice (portal only, status POSTED).
 * Idempotent per lease + period: an existing statement for the same subject is
 * returned instead of logging a duplicate.
 */
export async function postMonthlyStatement(leaseId: string, period: string, sentById: string | null = null) {
  const s = await buildMonthlyStatement(leaseId, period);
  const existing = await db.notice.findFirst({ where: { leaseId, type: "STATEMENT", subject: s.subject } });
  if (existing) return { statement: s, notice: existing, created: false };
  const notice = await db.notice.create({
    data: {
      leaseId,
      type: "STATEMENT",
      subject: s.subject,
      body: s.body,
      toEmail: s.toEmail,
      amountDue: s.totalDue,
      status: "POSTED",
      sentById,
    },
  });
  return { statement: s, notice, created: true };
}

/** Every ACTIVE lease except COMMON_AREA placeholders. */
export async function activeStatementLeaseIds(): Promise<string[]> {
  const leases = await db.lease.findMany({
    where: { status: "ACTIVE", unit: { status: { not: COMMON_AREA_STATUS } } },
    select: { id: true },
  });
  return leases.map((l) => l.id);
}

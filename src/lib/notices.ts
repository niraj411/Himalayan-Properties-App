// Notice templates for tenant past-due / demand / eviction notices.
// Pure rendering — no Date.now(); callers pass todayStr. Returns plain text.

export type NoticeType = "LATE" | "DEMAND" | "CO_DEMAND" | "CUSTOM";

export interface NoticeContext {
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  coTenant?: string | null;
  guarantor?: string | null;
  premises: string;
  commencementDate?: string | null;
  openCharges: { label: string; amount: number }[];
  totalDue: number;
  todayStr: string;
  cureDays?: number;
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function recipientBlock(ctx: NoticeContext): string {
  const lines = [ctx.tenantName];
  if (ctx.coTenant) lines.push(`Co-Tenant: ${ctx.coTenant}`);
  if (ctx.guarantor) lines.push(`Guarantor: ${ctx.guarantor}`);
  lines.push(ctx.premises);
  return lines.join("\n");
}

function chargeTable(ctx: NoticeContext): string {
  const rows = ctx.openCharges.map((c) => `  ${c.label} ${".".repeat(Math.max(2, 56 - c.label.length - money(c.amount).length))} ${money(c.amount)}`);
  rows.push("  " + "-".repeat(64));
  rows.push(`  TOTAL NOW DUE ${".".repeat(Math.max(2, 56 - "TOTAL NOW DUE".length - money(ctx.totalDue).length))} ${money(ctx.totalDue)}`);
  return rows.join("\n");
}

function signature(ctx: NoticeContext): string {
  return `Sincerely,\n\n${ctx.landlordName}\nBy: ____________________________, General Manager`;
}

function header(ctx: NoticeContext): string {
  return `${ctx.landlordName}\n${ctx.landlordAddress}\n\n${ctx.todayStr}\n\n${recipientBlock(ctx)}`;
}

export function renderNotice(type: NoticeType, ctx: NoticeContext): { subject: string; body: string } {
  const cureDays = ctx.cureDays ?? (type === "CO_DEMAND" ? 3 : 5);
  const jointly = ctx.guarantor || ctx.coTenant
    ? " This obligation is jointly and severally guaranteed by the co-tenant and/or guarantor named above."
    : "";

  if (type === "CUSTOM") return { subject: "", body: "" };

  if (type === "LATE") {
    const subject = `Notice of Past-Due Rent and Demand for Payment — ${ctx.premises}`;
    const body = `${header(ctx)}

RE: NOTICE OF PAST-DUE RENT AND DEMAND FOR PAYMENT

Dear ${ctx.tenantName}:

Our records show that rent for the above premises has not been received and is past due.${ctx.commencementDate ? ` Under your Lease Agreement (Commencement Date ${ctx.commencementDate}), rent is due in advance on or before the 1st of each month and is considered late if not received by 5:00 p.m. on the 5th.` : ""}

The following amounts are currently due and owing:

${chargeTable(ctx)}

Under Section 4 of your Lease, rent received after the 5th of the month is subject to a late charge, and continued non-payment constitutes a default.

DEMAND: Please remit the full balance of ${money(ctx.totalDue)} within ${cureDays} days of the date of this notice via your Baselane payment portal.

If payment is not received, the Landlord may post a formal 3-day Notice to Quit (Demand for Compliance or Possession), at which point an additional $250.00 administrative fee and $250.00 in attorneys' fees ($500.00 total) will be assessed as permitted under Section 4, and the Landlord may pursue all remedies available under the Lease and Colorado law, including termination of tenancy and eviction.${jointly}

If you have already submitted payment or believe this notice is in error, please reply to this email or contact us immediately.

${signature(ctx)}`;
    return { subject, body };
  }

  if (type === "DEMAND") {
    const subject = `Demand for Payment — ${ctx.premises}`;
    const body = `${header(ctx)}

RE: DEMAND FOR PAYMENT

Dear ${ctx.tenantName}:

This is a formal demand for payment of the past-due balance on your account for the above premises.

${chargeTable(ctx)}

DEMAND: Please remit the full balance of ${money(ctx.totalDue)} within ${cureDays} days of the date of this notice via your Baselane payment portal.${jointly}

If you have already submitted payment or believe this notice is in error, please reply to this email or contact us immediately.

${signature(ctx)}`;
    return { subject, body };
  }

  // CO_DEMAND
  const subject = `DEMAND FOR COMPLIANCE OR RIGHT TO POSSESSION — ${ctx.premises}`;
  const body = `NOTE: Attorney review recommended before service.

${header(ctx)}

RE: DEMAND FOR COMPLIANCE OR RIGHT TO POSSESSION (C.R.S. § 13-40-104)

TO: ${ctx.tenantName} and all others in possession of ${ctx.premises}:

YOU ARE HEREBY NOTIFIED that you are in default of your tenancy for non-payment of rent and other charges now due and owing in the total amount of ${money(ctx.totalDue)}:

${chargeTable(ctx)}

YOU ARE FURTHER NOTIFIED that within ${cureDays} days after service of this Notice you must either (1) pay the full amount of ${money(ctx.totalDue)} stated above, or (2) deliver up possession of the premises to the Landlord.

If you fail to pay the amount due or surrender possession within ${cureDays} days, the Landlord will commence a civil action for forcible entry and detainer (eviction) to recover possession of the premises, together with rent, costs, and attorneys' fees as permitted by law and your Lease.${jointly}

This Notice is given pursuant to C.R.S. § 13-40-104 and the terms of your Lease.

${signature(ctx)}`;
  return { subject, body };
}

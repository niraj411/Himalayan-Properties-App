// Agent action layer — the controlled, SAFE write surface for trusted agents
// (Jarvis dashboard, freeroam Telegram bot). Every action goes through the same
// business logic the admin UI uses (charges, notices, payments, insurance,
// utilities, messages) and produces a viewable DB record. No deletes, no settings
// changes, no tenant/lease edits — those stay admin-UI only.
//
// Design notes:
//  - Agents have no NextAuth session, so we resolve the ADMIN user as the "actor"
//    for records that need a fromId/sentById.
//  - Tenants can be addressed by free-text name (case-insensitive contains) or by
//    leaseId, so a natural-language command like "add a $100 late fee to Evelyn"
//    resolves to the right active lease.
//  - Each handler returns { ok, summary, record? } so the calling channel can echo
//    a human-readable confirmation back to the user.

import { db } from "@/lib/db";
import { sendEmail, sendTenantEmail } from "@/lib/email";
import { renderNotice, type NoticeType } from "@/lib/notices";
import { insuranceCopy } from "@/lib/insurance";
import { UTILITY_TYPES } from "@/lib/utilities";

const LANDLORD_NAME = "Himalayan Holding Property LLC";
const LANDLORD_ADDRESS = "884 Dakota Lane, Erie, CO 80516";

export type AgentActionResult = {
  ok: boolean;
  summary: string;
  record?: unknown;
  error?: string;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function todayStr(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

async function adminActorId(): Promise<string | null> {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  return admin?.id ?? null;
}

// Resolve an active lease (with the relations the actions need) from either an
// explicit leaseId or a tenant name/email. Throws a friendly Error when ambiguous
// or not found so the channel can relay the message.
type ResolvedLease = NonNullable<Awaited<ReturnType<typeof leaseInclude>>>;
function leaseInclude(where: Record<string, unknown>) {
  return db.lease.findFirst({
    where,
    include: {
      tenant: { include: { user: true } },
      coTenants: { include: { user: true } },
      unit: { include: { property: true } },
      charges: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function resolveLease(params: { leaseId?: string; tenant?: string; email?: string }): Promise<ResolvedLease> {
  if (params.leaseId) {
    const l = await leaseInclude({ id: params.leaseId });
    if (!l) throw new Error(`No lease found with id ${params.leaseId}.`);
    return l;
  }

  const needle = (params.tenant || params.email || "").trim().toLowerCase();
  if (!needle) throw new Error("Specify a tenant (name or email) or a leaseId.");

  // Candidate active leases; match tenant or co-tenant name/email in JS
  // (SQLite Prisma has no case-insensitive contains).
  const leases = await db.lease.findMany({
    where: { status: "ACTIVE" },
    include: {
      tenant: { include: { user: true } },
      coTenants: { include: { user: true } },
      unit: { include: { property: true } },
      charges: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const matches = leases.filter((l) => {
    const names = [l.tenant.user.name, l.tenant.user.email, ...l.coTenants.map((c) => c.user.name), ...l.coTenants.map((c) => c.user.email)]
      .filter(Boolean)
      .map((s) => s!.toLowerCase());
    return names.some((n) => n.includes(needle) || needle.includes(n));
  });

  if (matches.length === 0) throw new Error(`No active lease found matching "${params.tenant || params.email}".`);
  if (matches.length > 1) {
    const who = matches.map((m) => `${m.tenant.user.name} (${m.unit.property.name} ${m.unit.unitNumber})`).join("; ");
    throw new Error(`"${params.tenant || params.email}" matched multiple leases: ${who}. Be more specific or pass a leaseId.`);
  }
  return matches[0];
}

function premisesOf(l: ResolvedLease): string {
  const p = l.unit.property;
  return `${p.address}, ${p.city}, ${p.state} ${p.zip} — Unit ${l.unit.unitNumber}`;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function createCharge(p: Record<string, unknown>): Promise<AgentActionResult> {
  const lease = await resolveLease(p as never);
  const amount = Number(p.amount);
  if (!isFinite(amount) || amount <= 0) throw new Error("A positive numeric amount is required.");
  const kind = (typeof p.kind === "string" ? p.kind.toUpperCase() : "OTHER");
  const validKinds = ["RENT", "LATE_FEE", "UTILITY", "FINAL", "CLEANING", "DEPOSIT", "OTHER"];
  const label = (p.label as string) || (kind === "LATE_FEE" ? "Late fee" : kind === "RENT" ? "Rent" : "Charge");
  const charge = await db.charge.create({
    data: {
      leaseId: lease.id,
      kind: validKinds.includes(kind) ? kind : "OTHER",
      label,
      amount,
      dueDate: p.dueDate ? new Date(p.dueDate as string) : null,
      source: (p.source as string) || "Agent action",
      notes: (p.notes as string) || null,
    },
  });
  return {
    ok: true,
    summary: `Added ${kind.replace("_", " ").toLowerCase()} charge "${label}" of ${money(amount)} to ${lease.tenant.user.name} (${lease.unit.property.name} ${lease.unit.unitNumber}).`,
    record: charge,
  };
}

async function markChargePaid(p: Record<string, unknown>, waive = false): Promise<AgentActionResult> {
  let chargeId = p.chargeId as string | undefined;
  let lease: ResolvedLease | null = null;

  if (!chargeId) {
    // resolve by tenant + (label or amount): pick the single matching OPEN charge
    lease = await resolveLease(p as never);
    const open = lease.charges.filter((c) => c.status === "OPEN");
    const label = (p.label as string | undefined)?.toLowerCase();
    const amount = p.amount !== undefined ? Number(p.amount) : undefined;
    const cand = open.filter((c) =>
      (label ? c.label.toLowerCase().includes(label) : true) &&
      (amount !== undefined ? Math.abs(c.amount - amount) < 0.005 : true)
    );
    if (cand.length === 0) throw new Error(`No matching open charge for ${lease.tenant.user.name}.`);
    if (cand.length > 1) throw new Error(`Multiple open charges matched for ${lease.tenant.user.name}: ${cand.map((c) => `${c.label} ${money(c.amount)}`).join("; ")}. Pass a chargeId.`);
    chargeId = cand[0].id;
  }

  const updated = await db.charge.update({
    where: { id: chargeId },
    data: { status: waive ? "WAIVED" : "PAID", paidDate: waive ? null : new Date() },
  });
  return {
    ok: true,
    summary: `Marked charge "${updated.label}" (${money(updated.amount)}) as ${waive ? "WAIVED" : "PAID"}.`,
    record: updated,
  };
}

async function recordPayment(p: Record<string, unknown>): Promise<AgentActionResult> {
  const lease = await resolveLease(p as never);
  const amount = Number(p.amount);
  if (!isFinite(amount) || amount <= 0) throw new Error("A positive numeric amount is required.");
  const date = p.date ? new Date(p.date as string) : new Date();
  const payment = await db.payment.create({
    data: {
      leaseId: lease.id,
      amount,
      date,
      method: (p.method as string) || "OTHER",
      reference: (p.reference as string) || null,
      notes: (p.notes as string) || "Recorded via agent action",
    },
  });
  // Email the tenant a receipt (best-effort; never fails the action).
  try {
    const unitInfo = `${lease.unit.property.name} - Unit ${lease.unit.unitNumber}`;
    await sendTenantEmail({
      tenantName: lease.tenant.user.name,
      tenantEmail: lease.tenant.user.email,
      subject: "Payment Received",
      body: `We have recorded a payment of ${money(amount)} for ${unitInfo} on ${date.toLocaleDateString()}.\n\nThank you for your payment.`,
    });
  } catch { /* email is best-effort */ }
  return {
    ok: true,
    summary: `Recorded a ${money(amount)} payment for ${lease.tenant.user.name} (${lease.unit.property.name} ${lease.unit.unitNumber}) dated ${date.toLocaleDateString()}.`,
    record: payment,
  };
}

async function sendNotice(p: Record<string, unknown>): Promise<AgentActionResult> {
  const lease = await resolveLease(p as never);
  const type = (typeof p.type === "string" ? p.type.toUpperCase() : "LATE") as NoticeType;
  if (!["LATE", "DEMAND", "CO_DEMAND"].includes(type)) {
    throw new Error(`Unsupported notice type "${p.type}". Use LATE, DEMAND, or CO_DEMAND.`);
  }
  const openCharges = lease.charges.filter((c) => c.status === "OPEN").map((c) => ({ label: c.label, amount: c.amount }));
  if (openCharges.length === 0) {
    throw new Error(`${lease.tenant.user.name} has no open charges — nothing to demand. Add a charge first.`);
  }
  const totalDue = openCharges.reduce((s, c) => s + c.amount, 0);
  const coTenant = lease.coTenants.map((c) => c.user.name).join(", ") || null;
  const guarantor = lease.tenant.emergencyContact || null; // guarantor stored here

  const { subject, body } = renderNotice(type, {
    landlordName: LANDLORD_NAME,
    landlordAddress: LANDLORD_ADDRESS,
    tenantName: lease.tenant.user.name,
    coTenant,
    guarantor,
    premises: premisesOf(lease),
    commencementDate: lease.startDate ? new Date(lease.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null,
    openCharges,
    totalDue,
    todayStr: todayStr(),
  });

  const toEmail = lease.tenant.user.email;
  const ccList = (p.cc ? String(p.cc).split(",").map((s) => s.trim()).filter(Boolean) : undefined);
  const actorId = await adminActorId();

  try {
    const info = await sendEmail({ to: toEmail, cc: ccList, subject, body });
    const notice = await db.notice.create({
      data: {
        leaseId: lease.id, type, subject, body, toEmail,
        ccEmails: ccList && ccList.length ? ccList.join(", ") : null,
        amountDue: totalDue, status: "SENT", messageId: info?.messageId ?? null, sentById: actorId,
      },
    });
    return {
      ok: true,
      summary: `Sent ${type} notice to ${lease.tenant.user.name} <${toEmail}>${ccList?.length ? ` (cc ${ccList.join(", ")})` : ""} for ${money(totalDue)} past due.`,
      record: notice,
    };
  } catch (err) {
    const notice = await db.notice.create({
      data: {
        leaseId: lease.id, type, subject, body, toEmail,
        ccEmails: ccList && ccList.length ? ccList.join(", ") : null,
        amountDue: totalDue, status: "FAILED",
        errorText: err instanceof Error ? err.message : String(err), sentById: actorId,
      },
    });
    return { ok: false, summary: `Notice logged but email FAILED to ${toEmail}: ${notice.errorText}`, record: notice, error: notice.errorText ?? undefined };
  }
}

async function requestInsurance(p: Record<string, unknown>): Promise<AgentActionResult> {
  const lease = await resolveLease(p as never);
  const copy = insuranceCopy(lease.leaseType);
  const body = copy.requestBody(lease.unit.property.name, lease.unit.unitNumber);
  await sendTenantEmail({ tenantName: lease.tenant.user.name, tenantEmail: lease.tenant.user.email, subject: copy.requestSubject, body });
  const actorId = await adminActorId();
  const msg = await db.message.create({
    data: { fromId: actorId, toId: lease.tenant.userId, subject: copy.requestSubject, body },
  });
  return {
    ok: true,
    summary: `Sent an insurance request to ${lease.tenant.user.name} <${lease.tenant.user.email}> and logged it to Messages.`,
    record: msg,
  };
}

async function logMessage(p: Record<string, unknown>): Promise<AgentActionResult> {
  const lease = await resolveLease(p as never);
  const subject = (p.subject as string) || "Message from Himalayan Properties";
  const bodyText = (p.body as string) || "";
  if (!bodyText.trim()) throw new Error("A message body is required.");
  await sendTenantEmail({ tenantName: lease.tenant.user.name, tenantEmail: lease.tenant.user.email, subject, body: bodyText });
  const actorId = await adminActorId();
  const msg = await db.message.create({
    data: { fromId: actorId, toId: lease.tenant.userId, subject, body: bodyText },
  });
  return {
    ok: true,
    summary: `Emailed ${lease.tenant.user.name} <${lease.tenant.user.email}> "${subject}" and logged it to Messages.`,
    record: msg,
  };
}

async function addUtility(p: Record<string, unknown>): Promise<AgentActionResult> {
  // Resolve property by id or by name (contains).
  let propertyId = p.propertyId as string | undefined;
  let propName = "";
  if (!propertyId) {
    const needle = String(p.property || "").trim().toLowerCase();
    if (!needle) throw new Error("Specify a property (name or propertyId).");
    const props = await db.property.findMany();
    const match = props.filter((pr) => pr.name.toLowerCase().includes(needle) || pr.address.toLowerCase().includes(needle));
    if (match.length === 0) throw new Error(`No property matched "${p.property}".`);
    if (match.length > 1) throw new Error(`"${p.property}" matched multiple properties: ${match.map((m) => m.name).join("; ")}.`);
    propertyId = match[0].id;
    propName = match[0].name;
  } else {
    const pr = await db.property.findUnique({ where: { id: propertyId } });
    if (!pr) throw new Error(`No property with id ${propertyId}.`);
    propName = pr.name;
  }

  const type = (typeof p.type === "string" ? p.type.toUpperCase() : "OTHER");
  if (!UTILITY_TYPES.includes(type as never)) {
    throw new Error(`Unknown utility type "${p.type}". Use one of: ${UTILITY_TYPES.join(", ")}.`);
  }
  const providerName = (p.providerName as string) || (p.provider as string);
  if (!providerName) throw new Error("providerName is required.");

  const util = await db.utility.create({
    data: {
      propertyId,
      unitId: (p.unitId as string) || null,
      type,
      providerName,
      phone: (p.phone as string) || null,
      website: (p.website as string) || null,
      accountNumber: (p.accountNumber as string) || null,
      tenantNotes: (p.tenantNotes as string) || null,
      internalNotes: (p.internalNotes as string) || null,
      tenantVisible: p.tenantVisible === undefined ? true : Boolean(p.tenantVisible),
    },
  });
  return {
    ok: true,
    summary: `Added ${type} utility "${providerName}" to ${propName}${util.unitId ? ` (unit override)` : ""}.`,
    record: util,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher + read context
// ---------------------------------------------------------------------------

export const AGENT_ACTIONS = [
  "create_charge",
  "mark_charge_paid",
  "waive_charge",
  "record_payment",
  "send_notice",
  "request_insurance",
  "log_message",
  "add_utility",
] as const;
export type AgentAction = (typeof AGENT_ACTIONS)[number];

export async function runAgentAction(action: string, params: Record<string, unknown>): Promise<AgentActionResult> {
  try {
    switch (action) {
      case "create_charge": return await createCharge(params);
      case "mark_charge_paid": return await markChargePaid(params, false);
      case "waive_charge": return await markChargePaid(params, true);
      case "record_payment": return await recordPayment(params);
      case "send_notice": return await sendNotice(params);
      case "request_insurance": return await requestInsurance(params);
      case "log_message": return await logMessage(params);
      case "add_utility": return await addUtility(params);
      default:
        return { ok: false, summary: `Unknown or unsupported action "${action}". Allowed: ${AGENT_ACTIONS.join(", ")}.`, error: "unknown_action" };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, summary: msg, error: msg };
  }
}

// Compact, name-resolvable snapshot so an agent can map free-text -> the right
// lease/property before issuing an action. Read-only.
export async function getAgentContext() {
  const properties = await db.property.findMany({
    include: { units: { select: { id: true, unitNumber: true, status: true } } },
    orderBy: { name: "asc" },
  });
  const leases = await db.lease.findMany({
    where: { status: "ACTIVE" },
    include: {
      tenant: { include: { user: true } },
      coTenants: { include: { user: true } },
      unit: { include: { property: true } },
      charges: true,
    },
  });

  const tenants = leases.map((l) => {
    const open = l.charges.filter((c) => c.status === "OPEN");
    return {
      leaseId: l.id,
      tenant: l.tenant.user.name,
      email: l.tenant.user.email,
      coTenants: l.coTenants.map((c) => c.user.name),
      property: l.unit.property.name,
      propertyId: l.unit.property.id,
      unit: l.unit.unitNumber,
      leaseType: l.leaseType,
      baseRent: l.monthlyRent,
      nnn: l.nnnMonthly ?? null,
      balance: open.reduce((s, c) => s + c.amount, 0),
      openCharges: open.map((c) => ({ id: c.id, label: c.label, amount: c.amount })),
    };
  });

  return {
    landlord: { name: LANDLORD_NAME, address: LANDLORD_ADDRESS },
    properties: properties.map((p) => ({ id: p.id, name: p.name, type: p.type, units: p.units })),
    tenants,
    actions: AGENT_ACTIONS,
  };
}

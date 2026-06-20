import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

// Generates one Markdown record per tenant (+ an INDEX) under tenant-records/.
// Each file has YAML frontmatter (machine-parseable for AI agents / automation /
// date tracking) plus a readable body covering tenant info, every lease (dates,
// terms, base+NNN rent, deposit), escalations, insurance, charges, and key dates.
// Re-run any time to refresh: `npx tsx prisma/generate-tenant-records.ts`.

const OUT_DIR = path.join(process.cwd(), "tenant-records");
const TODAY = new Date();

const fmtDate = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "—");
const money = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const monthsBetween = (a: Date, b: Date) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24 * 30.44));

type Dated = { date: string; label: string; tenant: string };

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const tenants = await db.tenant.findMany({
    include: {
      user: true,
      unit: { include: { property: true } },
      leases: {
        include: {
          unit: { include: { property: true } },
          escalations: { orderBy: { effectiveDate: "asc" } },
          insurance: { orderBy: { expirationDate: "asc" } },
          charges: { orderBy: { dueDate: "asc" } },
          payments: { orderBy: { date: "desc" } },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });

  const upcoming: Dated[] = [];
  const indexRows: string[] = [];
  let fileCount = 0;

  for (const t of tenants) {
    const name = t.user.name;
    const activeLease = t.leases.find((l) => l.status === "ACTIVE") ?? t.leases[0] ?? null;
    const prop = activeLease?.unit.property ?? t.unit?.property ?? null;
    const unitNo = activeLease?.unit.unitNumber ?? t.unit?.unitNumber ?? "—";
    const base = activeLease?.monthlyRent ?? null;
    const nnn = activeLease?.nnnMonthly ?? null;
    const total = base != null ? base + (nnn ?? 0) : null;
    const outstanding = t.leases
      .flatMap((l) => l.charges)
      .filter((c) => c.status === "OPEN")
      .reduce((s, c) => s + c.amount, 0);
    const insAll = t.leases.flatMap((l) => l.insurance);
    const insOnFile = insAll.length > 0;
    const status = activeLease?.status ?? "NONE";

    // Collect key dates for the index roll-up
    for (const l of t.leases) {
      if (l.status === "ACTIVE") {
        upcoming.push({ date: fmtDate(l.endDate), label: `Lease end — ${name} (${prop?.name ?? ""} ${l.unit.unitNumber})`, tenant: name });
        for (const e of l.escalations) {
          if (!e.applied && new Date(e.effectiveDate) >= TODAY)
            upcoming.push({ date: fmtDate(e.effectiveDate), label: `Rent escalation → ${money(e.newMonthlyRent)} base — ${name}`, tenant: name });
        }
        for (const ins of l.insurance) {
          upcoming.push({ date: fmtDate(ins.expirationDate), label: `Insurance expires (${ins.carrier ?? "carrier?"}) — ${name}`, tenant: name });
        }
      }
    }

    // ---- frontmatter ----
    const fm: string[] = [
      "---",
      `tenant: ${JSON.stringify(name)}`,
      `email: ${t.user.email}`,
      `phone: ${JSON.stringify(t.user.phone ?? "")}`,
      `status: ${status}`,
      `property: ${JSON.stringify(prop?.name ?? "")}`,
      `unit: ${JSON.stringify(unitNo)}`,
      `lease_type: ${activeLease?.leaseType ?? "—"}`,
      `lease_start: ${fmtDate(activeLease?.startDate)}`,
      `lease_end: ${fmtDate(activeLease?.endDate)}`,
      `monthly_base: ${base ?? ""}`,
      `monthly_nnn: ${nnn ?? ""}`,
      `monthly_total: ${total ?? ""}`,
      `deposit: ${activeLease?.depositAmount ?? ""}`,
      `insurance_required: ${activeLease?.insuranceRequired ?? false}`,
      `insurance_on_file: ${insOnFile}`,
      `outstanding_balance: ${outstanding.toFixed(2)}`,
      `lease_count: ${t.leases.length}`,
      `generated: ${fmtDate(TODAY)}`,
      "---",
      "",
    ];

    const body: string[] = [];
    body.push(`# ${name}`, "");
    body.push("## Contact", "");
    body.push(`- **Email:** ${t.user.email}`);
    body.push(`- **Phone:** ${t.user.phone ?? "—"}`);
    if (t.emergencyContact) body.push(`- **Co-tenant / Guarantor:** ${t.emergencyContact}`);
    if (t.emergencyPhone) body.push(`- **Emergency phone:** ${t.emergencyPhone}`);
    body.push(`- **Property / Unit:** ${prop?.name ?? "—"}${prop ? ` — ${prop.address}, ${prop.city} ${prop.state}` : ""}, Unit ${unitNo}`);
    body.push(`- **Move-in:** ${fmtDate(t.moveInDate)} · **Move-out:** ${fmtDate(t.moveOutDate)}`);
    body.push("");

    for (const l of t.leases) {
      const lt = `${l.leaseType} lease — Unit ${l.unit.unitNumber} (${l.status})`;
      body.push(`## ${lt}`, "");
      const ltot = l.monthlyRent + (l.nnnMonthly ?? 0);
      body.push(`- **Term:** ${fmtDate(l.startDate)} → ${fmtDate(l.endDate)}  (~${monthsBetween(l.startDate, l.endDate)} months)`);
      body.push(`- **Rent:** base ${money(l.monthlyRent)}${l.nnnMonthly != null ? ` + NNN/CAM ${money(l.nnnMonthly)} = **${money(ltot)}/mo**` : "/mo"}`);
      body.push(`- **Deposit:** ${money(l.depositAmount)}${l.depositStatus ? ` (${l.depositStatus})` : ""}${l.depositPaidDate ? `, paid ${fmtDate(l.depositPaidDate)}` : ""}`);
      if (l.depositStatus === "RETURNED" || l.depositStatus === "PARTIAL_RETURN")
        body.push(`  - Returned ${money(l.depositReturnAmount)} on ${fmtDate(l.depositReturnDate)}${l.depositDeductionNotes ? ` — ${l.depositDeductionNotes}` : ""}`);
      body.push(`- **Insurance required:** ${l.insuranceRequired ? "yes" : "no"}`);
      if (l.documentUrl) body.push(`- **Signed document:** \`${l.documentUrl}\``);
      body.push("");

      if (l.escalations.length) {
        body.push("**Rent escalations:**", "");
        body.push("| Effective | Type | Value | New base rent | Applied |", "|---|---|---|---|---|");
        for (const e of l.escalations)
          body.push(`| ${fmtDate(e.effectiveDate)} | ${e.increaseType} | ${e.increaseValue ?? "—"} | ${money(e.newMonthlyRent)} | ${e.applied ? "yes" : "no"} |`);
        body.push("");
      }

      if (l.insurance.length) {
        body.push("**Insurance on file:**", "");
        body.push("| Type | Carrier | Policy # | Coverage | Effective | Expires | Verified |", "|---|---|---|---|---|---|---|");
        for (const i of l.insurance)
          body.push(`| ${i.insuranceType} | ${i.carrier ?? "—"} | ${i.policyNumber ?? "—"} | ${money(i.coverageAmount)} | ${fmtDate(i.effectiveDate)} | ${fmtDate(i.expirationDate)} | ${i.verified ? "✓" : "✗"} |`);
        body.push("");
      } else if (l.insuranceRequired) {
        body.push("**Insurance on file:** _none — non-compliant._", "");
      }

      const openCharges = l.charges.filter((c) => c.status === "OPEN");
      if (l.charges.length) {
        const owed = openCharges.reduce((s, c) => s + c.amount, 0);
        body.push(`**Charges** (${money(owed)} outstanding):`, "");
        body.push("| Due | Kind | Label | Amount | Status |", "|---|---|---|---|---|");
        for (const c of l.charges)
          body.push(`| ${fmtDate(c.dueDate)} | ${c.kind} | ${c.label} | ${money(c.amount)} | ${c.status} |`);
        body.push("");
      }

      if (l.payments.length) {
        const totalPaid = l.payments.reduce((s, p) => s + p.amount, 0);
        const last = l.payments[0];
        body.push(`**Payments:** ${l.payments.length} recorded, ${money(totalPaid)} total; most recent ${money(last.amount)} on ${fmtDate(last.date)}.`, "");
      }

      if (l.notes) {
        body.push("**Notes:**", "", "```", l.notes, "```", "");
      }
    }

    // Per-tenant key dates
    const myDates = upcoming.filter((u) => u.tenant === name && u.date !== "—").sort((a, b) => a.date.localeCompare(b.date));
    if (myDates.length) {
      body.push("## Key dates", "");
      for (const d of myDates) body.push(`- **${d.date}** — ${d.label.replace(` — ${name}`, "")}`);
      body.push("");
    }

    const file = path.join(OUT_DIR, `${slug(name)}.md`);
    fs.writeFileSync(file, fm.join("\n") + body.join("\n") + "\n");
    fileCount++;

    indexRows.push(
      `| [${name}](${slug(name)}.md) | ${prop?.name ?? "—"} ${unitNo} | ${activeLease?.leaseType ?? "—"} | ${fmtDate(activeLease?.startDate)} → ${fmtDate(activeLease?.endDate)} | ${money(total)} | ${insOnFile ? "✓" : "✗"} | ${money(outstanding)} |`
    );
  }

  // ---- INDEX ----
  const futureDates = upcoming.filter((u) => u.date !== "—" && u.date >= fmtDate(TODAY)).sort((a, b) => a.date.localeCompare(b.date));
  const idx: string[] = [];
  idx.push("# Tenant Records — Index", "");
  idx.push(`_Generated ${fmtDate(TODAY)} from production. ${fileCount} tenants. Regenerate: \`npx tsx prisma/generate-tenant-records.ts\`._`, "");
  idx.push("## Tenants", "");
  idx.push("| Tenant | Unit | Type | Term | Total/mo | Insurance | Outstanding |", "|---|---|---|---|---|---|---|");
  idx.push(...indexRows.sort());
  idx.push("");
  idx.push("## Upcoming key dates (for reminders / automation)", "");
  if (futureDates.length) {
    idx.push("| Date | Event |", "|---|---|");
    for (const d of futureDates) idx.push(`| ${d.date} | ${d.label} |`);
  } else {
    idx.push("_None upcoming._");
  }
  idx.push("");
  fs.writeFileSync(path.join(OUT_DIR, "INDEX.md"), idx.join("\n") + "\n");

  console.log(`Wrote ${fileCount} tenant records + INDEX.md to ${OUT_DIR}`);
  console.log(`Upcoming dates tracked: ${futureDates.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

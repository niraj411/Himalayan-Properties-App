import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Backfill monthly rent payments (base + CAM total, via Baselane) so the three
// 655 S Federal commercial tenants show PAID through the current month.
// Evelyn / Unit A (flower shop) is intentionally EXCLUDED — she keeps her open balance.
// Idempotent: matches existing payment by (leaseId, reference) and updates; safe to re-run.
// Marked paid per owner direction 2026-06-19.

const NOW_Y = 2026;
const NOW_M = 6; // include through June 2026 (current month)
const CAM_20 = 1074.53; // 2025 reconciled CAM share, 20% unit
const CAM_40 = 2149.05; // 2025 reconciled CAM share, 40% unit (D&E)

function monthsThroughNow(startY: number, startM: number) {
  const out: { y: number; m: number }[] = [];
  let y = startY, m = startM;
  while (y < NOW_Y || (y === NOW_Y && m <= NOW_M)) {
    out.push({ y, m });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

// Lexor base rent by period (facing-page schedule). 6/1/25-5/31/26 is MISSING from the
// lease; estimated at ~3% over the prior $2,184 = $2,250 (flagged in the note).
function lexorBase(y: number, m: number): { base: number; estimated: boolean } {
  const ord = y * 12 + m;
  if (ord < 2024 * 12 + 6) return { base: 2100.0, estimated: false }; // 6/1/23-5/31/24
  if (ord < 2025 * 12 + 6) return { base: 2184.0, estimated: false }; // 6/1/24-5/31/25
  if (ord < 2026 * 12 + 6) return { base: 2250.0, estimated: true };  // 6/1/25-5/31/26 (estimated)
  return { base: 2318.0, estimated: false };                          // 6/1/26-5/31/27 (current)
}

async function leaseFor(email: string) {
  const u = await db.user.findUnique({ where: { email } });
  if (!u) throw new Error(`No user for ${email}`);
  const t = await db.tenant.findUnique({ where: { userId: u.id } });
  if (!t) throw new Error(`No tenant for ${email}`);
  const l = await db.lease.findFirst({
    where: { tenantId: t.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!l) throw new Error(`No active lease for ${email}`);
  return l;
}

async function upsertPayment(leaseId: string, y: number, m: number, amount: number, notes: string) {
  const date = new Date(Date.UTC(y, m - 1, 1)); // rent due 1st of month
  const reference = `Baselane backfill ${y}-${String(m).padStart(2, "0")}`;
  const existing = await db.payment.findFirst({ where: { leaseId, reference } });
  const data = { amount, date, method: "BANK_TRANSFER", notes };
  if (existing) {
    await db.payment.update({ where: { id: existing.id }, data });
  } else {
    await db.payment.create({ data: { leaseId, reference, ...data } });
  }
}

async function main() {
  const tag = "marked paid per owner 2026-06-19";

  // Kenia's Bakery (Unit B) — base $2,121 flat (Yr1), from 2025-10
  const kenia = await leaseFor("keniatiscareno123@gmail.com");
  let kc = 0;
  for (const { y, m } of monthsThroughNow(2025, 10)) {
    const total = +(2121.0 + CAM_20).toFixed(2);
    await upsertPayment(kenia.id, y, m, total, `Backfilled rent: base $2,121.00 + CAM $1,074.53 = $${total} — ${tag}`);
    kc++;
  }

  // TZVECL / Elevate (Unit D&E) — base $4,347.08, from 2025-12 (assignment effective 12/5)
  const tz = await leaseFor("accounting@elevatemyeyes.com");
  let tc = 0;
  for (const { y, m } of monthsThroughNow(2025, 12)) {
    const total = +(4347.08 + CAM_40).toFixed(2);
    await upsertPayment(tz.id, y, m, total, `Backfilled rent: base $4,347.08 + CAM $2,149.05 = $${total} — ${tag}`);
    tc++;
  }

  // Lexor (Unit C) — base by schedule, from 2023-06 (tenant already in place)
  const lex = await leaseFor("hanson@lexor.com");
  let lc = 0;
  for (const { y, m } of monthsThroughNow(2023, 6)) {
    const { base, estimated } = lexorBase(y, m);
    const total = +(base + CAM_20).toFixed(2);
    const est = estimated ? " [base ESTIMATED — lease schedule omits 6/1/25-5/31/26]" : "";
    await upsertPayment(lex.id, y, m, total, `Backfilled rent: base $${base.toFixed(2)} + CAM $1,074.53 = $${total}${est} — ${tag}`);
    lc++;
  }

  console.log(`Backfilled payments — Kenia(B): ${kc}, TZVECL(D&E): ${tc}, Lexor(C): ${lc}. Evelyn/Unit A (flower shop) EXCLUDED (keeps open balance).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

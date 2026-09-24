import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Backfill structured LeaseEscalation rows from each lease's base-rent schedule
// (previously only in the lease notes text). newMonthlyRent = new BASE rent at
// that step. Past steps -> applied:true (already reflected in current monthlyRent);
// future steps -> applied:false (pending; show in the upcoming-dates roll-up).
// Idempotent: matched by (leaseId, effectiveDate). Re-run after schedule edits.
// TZVECL (D&E) has no schedule on file (original 2022 lease not held) -> omitted.
const TODAY = new Date();

const SCHEDULES: { email: string; esc: { date: string; rent: number; pct: number; note: string }[] }[] = [
  {
    email: "yriannaortega9@gmail.com", // Evelyn — Unit A, 2-yr, 4% annual
    esc: [{ date: "2027-02-01", rent: 2271.36, pct: 4.0, note: "Yr2 base @ $27.04/sf" }],
  },
  {
    email: "keniatiscareno123@gmail.com", // Kenia's Bakery — Unit B, 5-yr (Oct->Sep)
    esc: [
      { date: "2026-10-01", rent: 2184.0, pct: 2.97, note: "Yr2 base" },
      { date: "2027-10-01", rent: 2250.0, pct: 3.02, note: "Yr3 base" },
      { date: "2028-10-01", rent: 2317.0, pct: 2.98, note: "Yr4 base" },
      { date: "2029-10-01", rent: 2386.0, pct: 2.98, note: "Yr5 base" },
    ],
  },
  {
    email: "hanson@lexor.com", // Lexor — Unit C, 5-yr (Jun->May)
    esc: [
      { date: "2024-06-01", rent: 2184.0, pct: 4.0, note: "Yr2 base ($26.00/sf)" },
      { date: "2025-06-01", rent: 2250.0, pct: 3.02, note: "Yr3 base — ESTIMATED (lease schedule omits 6/1/25-5/31/26)" },
      { date: "2026-06-01", rent: 2318.0, pct: 3.02, note: "Yr4 base ($27.60/sf) — current" },
      { date: "2027-06-01", rent: 2371.0, pct: 2.29, note: "Yr5 base ($28.22/sf)" },
    ],
  },
  {
    email: "hessekclaire@gmail.com", // Claire — Unit B residential; conditional holdover
    esc: [{ date: "2027-05-01", rent: 3203.75, pct: 15.0, note: "CONDITIONAL month-to-month holdover rate (base $3,162.50 + $41.25 pet)" }],
  },
];

async function leaseFor(email: string) {
  const u = await db.user.findUnique({ where: { email } });
  if (!u) return null;
  const t = await db.tenant.findUnique({ where: { userId: u.id } });
  if (!t) return null;
  return db.lease.findFirst({ where: { tenantId: t.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
}

async function main() {
  let created = 0, updated = 0;
  for (const s of SCHEDULES) {
    const lease = await leaseFor(s.email);
    if (!lease) {
      console.log(`! no active lease for ${s.email} — skipped`);
      continue;
    }
    for (const e of s.esc) {
      const effectiveDate = new Date(e.date);
      const applied = effectiveDate <= TODAY;
      const data = {
        leaseId: lease.id,
        effectiveDate,
        newMonthlyRent: e.rent,
        increaseType: "PERCENTAGE",
        increaseValue: e.pct,
        notes: e.note,
        applied,
      };
      const existing = await db.leaseEscalation.findFirst({ where: { leaseId: lease.id, effectiveDate } });
      if (existing) {
        await db.leaseEscalation.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await db.leaseEscalation.create({ data });
        created++;
      }
    }
    console.log(`${s.email}: ${s.esc.length} escalations on lease ${lease.id}`);
  }
  console.log(`Escalations — created ${created}, updated ${updated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

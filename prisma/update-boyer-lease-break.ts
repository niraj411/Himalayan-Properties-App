import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Darin Boyer (3174 W Center Ave, Unit A) — early lease break.
 *
 * Moved in 2026-05-07, terminating early via a signed lease-break addendum,
 * vacating 2026-05-31. The addendum sets the break fee at 3 months' rent.
 *
 * Numbers (rent confirmed from the lease: $2,485/mo = $2,450 base + $35 pet):
 *   Lease-break fee (addendum): 3 x $2,485 = $7,455.00
 *   Paid:  deposit $4,287.50 (APPLIED to break, non-refundable)
 *        + cash    $2,000.00
 *        = $6,287.50 applied  ->  remaining break-fee balance $1,167.50
 *   Plus final utility reimbursement + move-out cleaning (kitchen/bathroom): $149.00
 *   TOTAL DUE 2026-06-15: $1,316.50  ($1,167.50 fee balance + $149 utility/cleaning)
 *
 * All lease records are KEPT (lease marked TERMINATED, not deleted).
 * Unit A returns to the market: VACANT @ $2,500/mo.
 *
 * Idempotent — safe to re-run (overwrites prior break values).
 */
async function main() {
  const TERMINATION_DATE = new Date("2026-05-31");
  const FINAL_PAYMENT_DUE = new Date("2026-06-15");

  const MONTHLY_RENT = 2485;
  const BREAK_FEE = MONTHLY_RENT * 3; // 7455
  const DEPOSIT = 4287.5;
  const CASH_PAID = 2000;
  const APPLIED = DEPOSIT + CASH_PAID; // 6287.50
  const FEE_BALANCE = BREAK_FEE - APPLIED; // 1167.50
  const UTIL_CLEANING = 149;
  const TOTAL_DUE = FEE_BALANCE + UTIL_CLEANING; // 1316.50

  const tenant = await db.tenant.findFirst({
    where: { user: { email: "darinboyer2000@gmail.com" } },
    include: { user: true, unit: true },
  });
  if (!tenant) throw new Error("Could not find tenant Darin Boyer.");
  if (!tenant.unitId) throw new Error("Darin's tenant record has no unit.");

  const lease = await db.lease.findFirst({
    where: { tenantId: tenant.id, unitId: tenant.unitId },
    orderBy: { createdAt: "desc" },
  });
  if (!lease) throw new Error("Could not find Darin's lease.");

  const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Preserve the original lease detail notes; (re)prepend the lease-break summary.
  const SEP = "----------------------------------------";
  const sepIdx = lease.notes ? lease.notes.indexOf(SEP) : -1;
  const originalNotes =
    sepIdx >= 0 ? lease.notes!.slice(sepIdx + SEP.length).replace(/^\n+/, "") : lease.notes ?? "";

  const breakHeader = [
    "*** LEASE BREAK ADDENDUM — effective 2026-05-31 ***",
    "Tenant terminated the lease early via signed lease-break addendum. Original term: 2026-05-07 to 2027-04-30. Vacate/move-out date: 2026-05-31. Unit A returned to market @ $2,500/mo.",
    `Lease-break fee per addendum: $${usd(BREAK_FEE)} = 3 months' rent @ $${usd(MONTHLY_RENT)}/mo.`,
    "Settlement:",
    `  - Security deposit $${usd(DEPOSIT)}: APPLIED to the break fee (non-refundable per addendum).`,
    `  - Cash payment $${usd(CASH_PAID)}: PAID toward break fee.`,
    `  - => $${usd(APPLIED)} applied; remaining break-fee balance $${usd(FEE_BALANCE)}.`,
    `  - Final utility reimbursement + move-out cleaning (kitchen/bathroom), combined: $${usd(UTIL_CLEANING)}.`,
    `  - TOTAL DUE 2026-06-15: $${usd(TOTAL_DUE)} ($${usd(FEE_BALANCE)} remaining fee + $${usd(UTIL_CLEANING)} utility/cleaning). Tenant said he will pay on the 15th.`,
    "Records retained below — original lease terms unchanged.",
    SEP,
  ].join("\n");

  await db.lease.update({
    where: { id: lease.id },
    data: {
      status: "TERMINATED",
      endDate: TERMINATION_DATE,
      depositStatus: "APPLIED_TO_BREAK",
      depositReturnDate: TERMINATION_DATE,
      depositReturnAmount: 0,
      depositDeductionNotes: `Full $${usd(DEPOSIT)} security deposit applied to the lease-break fee (3 months' rent = $${usd(BREAK_FEE)}) per signed addendum. Non-refundable; $0 returned to tenant.`,
      notes: `${breakHeader}\n${originalNotes}`,
    },
  });

  // Tenant move-out date.
  await db.tenant.update({
    where: { id: tenant.id },
    data: { moveOutDate: TERMINATION_DATE },
  });

  // Return Unit A to the market.
  await db.unit.update({
    where: { id: tenant.unitId },
    data: { status: "VACANT", rent: 2500 },
  });

  // Record the $2,000 cash payment toward the break fee (already paid).
  // Idempotent: update any prior "Lease-break" payment rather than duplicating.
  const feePayment = await db.payment.findFirst({
    where: { leaseId: lease.id, reference: { contains: "Lease-break" } },
  });
  const feeData = {
    leaseId: lease.id,
    amount: CASH_PAID,
    date: TERMINATION_DATE,
    method: "OTHER",
    reference: "Lease-break fee (partial)",
    notes: `Cash payment toward the $${usd(BREAK_FEE)} lease-break fee (3 months' rent per addendum). With the $${usd(DEPOSIT)} deposit applied, $${usd(APPLIED)} of the fee is covered; $${usd(FEE_BALANCE)} remains.`,
  };
  if (feePayment) {
    await db.payment.update({ where: { id: feePayment.id }, data: feeData });
  } else {
    await db.payment.create({ data: feeData });
  }

  // Reminder for the remaining balance due 2026-06-15.
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    const reminderData = {
      userId: admin.id,
      type: "RENT_DUE",
      title: `Darin Boyer — $${usd(TOTAL_DUE)} lease-break balance due`,
      message: `Remaining break-fee balance $${usd(FEE_BALANCE)} + utility/move-out cleaning $${usd(UTIL_CLEANING)} = $${usd(TOTAL_DUE)}. Due 2026-06-15 per tenant.`,
      dueDate: FINAL_PAYMENT_DUE,
      entityId: lease.id,
    };
    const existingReminder = await db.reminder.findFirst({
      where: { entityId: lease.id, type: "RENT_DUE", userId: admin.id },
    });
    if (existingReminder) {
      await db.reminder.update({ where: { id: existingReminder.id }, data: reminderData });
    } else {
      await db.reminder.create({ data: reminderData });
    }
  }

  console.log("Done — Darin Boyer lease break (corrected) applied.");
  console.log(`  Lease ${lease.id}: TERMINATED, ends ${TERMINATION_DATE.toDateString()}`);
  console.log(`  Unit ${tenant.unitId}: VACANT @ $2,500/mo (re-listed)`);
  console.log(`  Break fee $${usd(BREAK_FEE)} (3 x $${usd(MONTHLY_RENT)}); applied $${usd(APPLIED)} (deposit + $2,000 cash).`);
  console.log(`  Remaining: $${usd(FEE_BALANCE)} fee + $${usd(UTIL_CLEANING)} util/clean = $${usd(TOTAL_DUE)} due 2026-06-15.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

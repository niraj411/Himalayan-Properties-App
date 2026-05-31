import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Darin Boyer (3174 W Center Ave, Unit A) — early lease break.
 *
 * He moved in 2026-05-07 and is terminating early via a signed lease-break
 * addendum, vacating 2026-05-31. Settlement:
 *   1) $4,287.50 security deposit — APPLIED to the lease break (non-refundable).
 *   2) $2,000 lease-break fee — PAID.
 *   3) $149 final utility reimbursement + move-out cleaning (kitchen/bathroom),
 *      combined — DUE 2026-06-15 (he said he'll pay on the 15th).
 *
 * All of his lease records are KEPT (lease is marked TERMINATED, not deleted).
 * Unit A is returned to the market: VACANT @ $2,500/mo.
 *
 * Idempotent — safe to re-run.
 */
async function main() {
  const TERMINATION_DATE = new Date("2026-05-31");
  const FINAL_PAYMENT_DUE = new Date("2026-06-15");

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

  // Preserve the original lease detail notes; prepend the lease-break summary.
  const breakHeader = [
    "*** LEASE BREAK ADDENDUM — effective 2026-05-31 ***",
    "Tenant terminated the lease early via signed lease-break addendum. Original term: 2026-05-07 to 2027-04-30. Vacate/move-out date: 2026-05-31. Unit A returned to market @ $2,500/mo.",
    "Settlement:",
    "  - Security deposit $4,287.50: APPLIED to the lease break (non-refundable per addendum). Tenant receives nothing back.",
    "  - Lease-break fee $2,000.00: PAID.",
    "  - Final utility reimbursement + move-out cleaning (kitchen/bathroom), combined $149.00: DUE 2026-06-15 (tenant said he will pay on the 15th).",
    "Records retained below — original lease terms unchanged.",
    "----------------------------------------",
  ].join("\n");

  const newNotes = lease.notes?.startsWith("*** LEASE BREAK")
    ? lease.notes // already applied
    : `${breakHeader}\n${lease.notes ?? ""}`;

  await db.lease.update({
    where: { id: lease.id },
    data: {
      status: "TERMINATED",
      endDate: TERMINATION_DATE,
      depositStatus: "APPLIED_TO_BREAK",
      depositReturnDate: TERMINATION_DATE,
      depositReturnAmount: 0,
      depositDeductionNotes:
        "Full $4,287.50 security deposit applied to the lease-break settlement (non-refundable per lease-break addendum). $0 returned to tenant.",
      notes: newNotes,
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

  // Record the $2,000 lease-break fee (already paid). Idempotent on reference.
  const existingFee = await db.payment.findFirst({
    where: { leaseId: lease.id, reference: "Lease-break fee" },
  });
  if (!existingFee) {
    await db.payment.create({
      data: {
        leaseId: lease.id,
        amount: 2000,
        date: TERMINATION_DATE,
        method: "OTHER",
        reference: "Lease-break fee",
        notes:
          "Lease-break / early-termination fee per signed addendum. Paid by Darin Boyer (in addition to the $4,287.50 deposit applied to the break).",
      },
    });
  }

  // Backstop reminder for the $149 final payment due 2026-06-15.
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    const existingReminder = await db.reminder.findFirst({
      where: { entityId: lease.id, type: "RENT_DUE", userId: admin.id },
    });
    if (!existingReminder) {
      await db.reminder.create({
        data: {
          userId: admin.id,
          type: "RENT_DUE",
          title: "Darin Boyer — $149 lease-break balance due",
          message:
            "Final utility reimbursement + move-out cleaning (kitchen/bathroom), combined $149.00. Due 2026-06-15 per tenant.",
          dueDate: FINAL_PAYMENT_DUE,
          entityId: lease.id,
        },
      });
    }
  }

  console.log("Done — Darin Boyer lease break applied.");
  console.log(`  Lease ${lease.id}: TERMINATED, ends ${TERMINATION_DATE.toDateString()}`);
  console.log(`  Unit ${tenant.unitId}: VACANT @ $2,500/mo (re-listed)`);
  console.log("  $2,000 lease-break fee recorded as paid; $149 due 2026-06-15 (reminder set).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

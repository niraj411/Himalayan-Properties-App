import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { round2 } from "@/lib/ledger";

// Server-only ledger helpers that touch the database. Kept separate from the
// pure math in ledger.ts so client components can import the math without
// pulling Prisma into the browser bundle.

/** Lease ids a tenant can see — their own leases plus any they co-tenant. */
export async function leaseIdsForTenant(tenantId: string): Promise<string[]> {
  const leases = await db.lease.findMany({
    where: {
      OR: [{ tenantId }, { coTenants: { some: { id: tenantId } } }],
    },
    select: { id: true },
  });
  return leases.map((l) => l.id);
}

/**
 * Allocate `amount` of a payment to a charge, capped at the charge's remaining
 * balance. Marks the charge PAID once fully settled. Verifies the charge
 * belongs to `leaseId`. Runs inside the given transaction client.
 */
export async function allocatePaymentToCharge(
  tx: Prisma.TransactionClient,
  chargeId: string,
  leaseId: string,
  amount: number
): Promise<void> {
  const charge = await tx.charge.findUnique({ where: { id: chargeId } });
  if (!charge || charge.leaseId !== leaseId) {
    throw new Error("Charge does not belong to this lease");
  }
  const newPaid = round2(Math.min(charge.amount, (charge.amountPaid ?? 0) + amount));
  const fullySettled = newPaid >= charge.amount - 0.005;
  await tx.charge.update({
    where: { id: chargeId },
    data: {
      amountPaid: newPaid,
      ...(fullySettled && charge.status === "OPEN"
        ? { status: "PAID", paidDate: new Date() }
        : {}),
    },
  });
}

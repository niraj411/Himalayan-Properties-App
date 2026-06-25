// Pure ledger math — safe to import from both server and client components
// (no database or server-only imports). Keeps balance computation identical
// everywhere: remaining = amount - amountPaid for OPEN charges.

export interface ChargeLike {
  amount: number;
  amountPaid: number;
  status: string;
}

/** Round to whole cents to avoid binary-float drift in summed balances. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Outstanding amount on a single charge. WAIVED/PAID settle to 0. */
export function chargeRemaining(c: ChargeLike): number {
  if (c.status === "WAIVED" || c.status === "PAID") return 0;
  return round2(Math.max(0, c.amount - (c.amountPaid ?? 0)));
}

/** Total open balance across a set of charges. */
export function openBalance(charges: ChargeLike[]): number {
  return round2(
    charges
      .filter((c) => c.status === "OPEN")
      .reduce((s, c) => s + chargeRemaining(c), 0)
  );
}

/**
 * Validate a money input. Returns a finite, non-negative number rounded to
 * cents, or null if the value isn't usable. Use to reject NaN/negative writes.
 */
export function parseMoney(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (!Number.isFinite(n) || n < 0) return null;
  return round2(n);
}

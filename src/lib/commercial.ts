// Pricing math for marketing a COMMERCIAL unit. Unit.rent holds the BASE rent per
// month; Unit.nnnMonthly the estimated NNN/CAM per month for a vacant bay (the
// leased equivalent lives on Lease.nnnMonthly). Used by the public listings, the
// flyer PDF and the leasing packet so every surface quotes the same numbers.

export interface CommercialUnitLike {
  rent: number;
  sqft?: number | null;
  nnnMonthly?: number | null;
}

export const usd = (n: number, cents = true) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

/** Annual base rent per square foot, or null when sqft is unknown. */
export function perSfYear(rentMonthly: number, sqft?: number | null): number | null {
  if (!sqft || sqft <= 0) return null;
  return (rentMonthly * 12) / sqft;
}

export interface CommercialPricing {
  base: number;
  perSf: number | null;
  nnn: number | null;
  total: number;
  /** "$26.00/sf/yr NNN" or null */
  perSfLabel: string | null;
  /** "$2,184/mo base" */
  baseLabel: string;
  /** "est. NNN $1,074.53/mo" or null */
  nnnLabel: string | null;
  /** "≈ $3,258.53/mo all-in" (same as base when no NNN) */
  totalLabel: string;
}

export function commercialPricing(u: CommercialUnitLike): CommercialPricing {
  const perSf = perSfYear(u.rent, u.sqft);
  const nnn = u.nnnMonthly ?? null;
  const total = u.rent + (nnn ?? 0);
  return {
    base: u.rent,
    perSf,
    nnn,
    total,
    perSfLabel: perSf != null ? `${usd(perSf)}/sf/yr NNN` : null,
    baseLabel: `${usd(u.rent, false)}/mo base`,
    nnnLabel: nnn != null ? `est. NNN ${usd(nnn)}/mo` : null,
    totalLabel: nnn != null ? `≈ ${usd(total)}/mo all-in` : `${usd(u.rent, false)}/mo`,
  };
}

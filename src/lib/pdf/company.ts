// Server-side loader for the company/letterhead identity shown on generated
// PDFs. Prefers the editable Settings row, falls back to the legal landlord
// entity used elsewhere (notices) so documents are never blank.
import { db } from "@/lib/db";
import type { Company } from "./theme";

const FALLBACK: Company = {
  name: "Himalayan Properties",
  address: "884 Dakota Lane, Erie, CO 80516",
  phone: null,
  email: null,
  paymentLink: null,
};

export async function loadCompany(): Promise<Company> {
  const s = await db.settings.findFirst();
  if (!s) return FALLBACK;
  return {
    name: s.companyName || FALLBACK.name,
    address: s.companyAddress || FALLBACK.address,
    phone: s.companyPhone || null,
    email: s.companyEmail || null,
    paymentLink: s.baselanePaymentLink || null,
  };
}

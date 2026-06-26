// Type-aware insurance copy + constants.
// Pure module (no React, no Prisma) so it can be imported from both server routes
// and client components. Residential => renters insurance / "additional interest";
// commercial => general liability / "additional insured".

export const BENEFICIARY_NAME = "Himalayan Holdings Property LLC";

export interface InsuranceTypeOption {
  value: string;
  label: string;
}

export interface InsuranceCopy {
  /** Section/card heading shown to the tenant */
  sectionTitle: string;
  /** Default insuranceType written when a tenant submits a new record */
  defaultInsuranceType: string;
  /** ADDITIONAL_INTEREST (residential) or ADDITIONAL_INSURED (commercial) */
  interestType: string;
  /** Human phrase for how the landlord should be listed on the policy */
  interestPhrase: string;
  /** Body for the "insurance required" alert in the portal */
  requiredBody: string;
  /** Type options for the insurance-type <Select> */
  typeOptions: InsuranceTypeOption[];
  requestSubject: string;
  requestBody: (propertyName: string, unitNumber: string) => string;
  renewalSubject: string;
  renewalBody: (expirationDateFormatted: string) => string;
}

const COMMERCIAL: InsuranceCopy = {
  sectionTitle: "Business Liability Insurance",
  defaultInsuranceType: "LIABILITY",
  interestType: "ADDITIONAL_INSURED",
  interestPhrase: "additional insured",
  requiredBody: `Commercial tenants must maintain valid business liability insurance with ${BENEFICIARY_NAME} listed as an additional insured.`,
  typeOptions: [
    { value: "LIABILITY", label: "General Liability" },
    { value: "PROPERTY", label: "Property Insurance" },
    { value: "WORKERS_COMP", label: "Workers Compensation" },
  ],
  requestSubject: "Action Required: Upload Your Liability Insurance Certificate",
  requestBody: (propertyName, unitNumber) =>
    `As part of your commercial lease at ${propertyName} - Unit #${unitNumber}, you are required to maintain valid liability insurance with ${BENEFICIARY_NAME} listed as an additional insured.\n\nPlease log in to your tenant portal and upload your current certificate of insurance at your earliest convenience.\n\nIf you have any questions, please don't hesitate to reach out.`,
  renewalSubject: "Action Required: Insurance Certificate Renewal",
  renewalBody: (expDate) =>
    `Your liability insurance certificate on file expires on ${expDate}.\n\nPlease upload a renewed certificate through your tenant portal or email it to us as soon as possible to remain in compliance with your lease terms.\n\nIf you have already renewed, please disregard this message.`,
};

const RESIDENTIAL: InsuranceCopy = {
  sectionTitle: "Renters Insurance",
  defaultInsuranceType: "RENTERS",
  interestType: "ADDITIONAL_INTEREST",
  interestPhrase: "additional interest",
  requiredBody: `We ask that all residents maintain valid renters insurance with ${BENEFICIARY_NAME} listed as an additional interest.`,
  // Residential tenants must carry a renters policy — not a liability-only
  // policy — so renters is the only accepted type.
  typeOptions: [
    { value: "RENTERS", label: "Renters Insurance" },
  ],
  requestSubject: "Action Required: Upload Your Renters Insurance",
  requestBody: (propertyName, unitNumber) =>
    `As a resident at ${propertyName} - Unit #${unitNumber}, we ask that you maintain valid renters insurance with ${BENEFICIARY_NAME} listed as an additional interest.\n\nPlease log in to your tenant portal and upload your current proof of insurance at your earliest convenience.\n\nIf you have any questions, please don't hesitate to reach out.`,
  renewalSubject: "Action Required: Renters Insurance Renewal",
  renewalBody: (expDate) =>
    `Your renters insurance on file expires on ${expDate}.\n\nPlease upload a renewed proof of insurance through your tenant portal or email it to us as soon as possible.\n\nIf you have already renewed, please disregard this message.`,
};

/** Returns type-aware copy. Any non-"COMMERCIAL" value is treated as residential. */
export function insuranceCopy(leaseType: string | null | undefined): InsuranceCopy {
  return leaseType === "COMMERCIAL" ? COMMERCIAL : RESIDENTIAL;
}

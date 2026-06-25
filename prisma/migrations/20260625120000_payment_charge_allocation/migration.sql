-- Link payments to the charge they settle, and track partial settlement on charges.
ALTER TABLE "Charge" ADD COLUMN "amountPaid" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "chargeId" TEXT;

-- Backfill: fully-paid charges have amountPaid = amount so remaining (amount - amountPaid) = 0.
UPDATE "Charge" SET "amountPaid" = "amount" WHERE "status" = 'PAID';

CREATE INDEX IF NOT EXISTS "Payment_chargeId_idx" ON "Payment"("chargeId");

-- AlterTable: add repair cost / contractor / payment tracking to maintenance requests
ALTER TABLE "MaintenanceRequest" ADD COLUMN "contractor" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "repairCost" REAL;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "paymentAccount" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "chargeId" TEXT;

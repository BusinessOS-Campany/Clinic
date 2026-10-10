-- CreateEnum
CREATE TYPE "MedicationForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'SUSPENSION', 'DROPS', 'TOPICAL', 'INJECTION', 'INHALER', 'SUPPOSITORY', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicationRoute" AS ENUM ('ORAL', 'SUBLINGUAL', 'TOPICAL', 'INHALATION', 'INTRAVENOUS', 'INTRAMUSCULAR', 'SUBCUTANEOUS', 'RECTAL', 'VAGINAL', 'OPHTHALMIC', 'OTIC', 'NASAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'SIGNED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CONTRAINDICATED');

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "strength" TEXT,
    "strengthUnit" TEXT,
    "form" "MedicationForm" NOT NULL DEFAULT 'TABLET',
    "route" "MedicationRoute" NOT NULL DEFAULT 'ORAL',
    "atcCode" TEXT,
    "category" TEXT,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "inventoryItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "prescriberId" TEXT,
    "prescriptionNo" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "instructions" TEXT,
    "notes" TEXT,
    "overrideReason" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicationId" TEXT,
    "medicationName" TEXT NOT NULL,
    "genericName" TEXT,
    "strength" TEXT,
    "form" "MedicationForm",
    "route" "MedicationRoute",
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "durationDays" INTEGER,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT,
    "instructions" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "refillsAllowed" INTEGER NOT NULL DEFAULT 0,
    "refillsRemaining" INTEGER NOT NULL DEFAULT 0,
    "dispensedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationInteraction" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "drugA" TEXT NOT NULL,
    "drugB" TEXT NOT NULL,
    "severity" "InteractionSeverity" NOT NULL DEFAULT 'MODERATE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicationInteraction_pkey" PRIMARY KEY ("id")
);

-- AlterTable Dispensation
ALTER TABLE "Dispensation" ADD COLUMN "prescriptionId" TEXT;
ALTER TABLE "Dispensation" ADD COLUMN "prescriptionItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Medication_clinicId_code_key" ON "Medication"("clinicId", "code");
CREATE INDEX "Medication_clinicId_genericName_idx" ON "Medication"("clinicId", "genericName");
CREATE INDEX "Medication_clinicId_isActive_idx" ON "Medication"("clinicId", "isActive");

CREATE UNIQUE INDEX "Prescription_clinicId_prescriptionNo_key" ON "Prescription"("clinicId", "prescriptionNo");
CREATE UNIQUE INDEX "Prescription_verificationCode_key" ON "Prescription"("verificationCode");
CREATE INDEX "Prescription_clinicId_status_createdAt_idx" ON "Prescription"("clinicId", "status", "createdAt");
CREATE INDEX "Prescription_patientId_createdAt_idx" ON "Prescription"("patientId", "createdAt");
CREATE INDEX "Prescription_encounterId_idx" ON "Prescription"("encounterId");

CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");
CREATE INDEX "PrescriptionItem_medicationId_idx" ON "PrescriptionItem"("medicationId");

CREATE INDEX "MedicationInteraction_clinicId_drugA_idx" ON "MedicationInteraction"("clinicId", "drugA");
CREATE INDEX "MedicationInteraction_clinicId_drugB_idx" ON "MedicationInteraction"("clinicId", "drugB");

CREATE INDEX "Dispensation_prescriptionId_idx" ON "Dispensation"("prescriptionId");
CREATE INDEX "Dispensation_prescriptionItemId_idx" ON "Dispensation"("prescriptionItemId");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescriberId_fkey" FOREIGN KEY ("prescriberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MedicationInteraction" ADD CONSTRAINT "MedicationInteraction_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Dispensation" ADD CONSTRAINT "Dispensation_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispensation" ADD CONSTRAINT "Dispensation_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

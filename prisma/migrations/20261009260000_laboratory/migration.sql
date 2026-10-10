-- AlterEnum
ALTER TYPE "LabRequestStatus" ADD VALUE 'REJECTED';

-- CreateEnum
CREATE TYPE "LabPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "LabSpecimenType" AS ENUM ('BLOOD', 'SERUM', 'PLASMA', 'URINE', 'STOOL', 'SPUTUM', 'SWAB', 'CSF', 'TISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "LabRejectionReason" AS ENUM ('HEMOLYZED', 'CLOTTED', 'INSUFFICIENT_VOLUME', 'WRONG_CONTAINER', 'UNLABELED', 'CONTAMINATED', 'EXPIRED', 'OTHER');

-- CreateEnum
CREATE TYPE "LabResultFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'CRITICAL_LOW', 'CRITICAL_HIGH', 'ABNORMAL');

-- CreateEnum
CREATE TYPE "LabRangeSex" AS ENUM ('ANY', 'MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "LabTestCategory" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabTestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReferenceRange" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "sex" "LabRangeSex" NOT NULL DEFAULT 'ANY',
    "ageMinYears" INTEGER,
    "ageMaxYears" INTEGER,
    "low" DECIMAL(65,30),
    "high" DECIMAL(65,30),
    "criticalLow" DECIMAL(65,30),
    "criticalHigh" DECIMAL(65,30),
    "unit" TEXT,
    "method" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabReferenceRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResultAmendment" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "previousFlag" "LabResultFlag",
    "newFlag" "LabResultFlag",
    "reason" TEXT,
    "amendedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabResultAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabQcRecord" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "testId" TEXT,
    "testName" TEXT NOT NULL,
    "level" TEXT,
    "lotNumber" TEXT,
    "expected" TEXT,
    "observed" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "equipment" TEXT,
    "recordedBy" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "LabQcRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabEquipment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastServiceAt" TIMESTAMP(3),
    "nextServiceDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabEquipmentMaintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "type" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT,
    "cost" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabEquipmentMaintenance_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LabTest" ADD COLUMN "categoryId" TEXT,
ADD COLUMN "method" TEXT,
ADD COLUMN "specimenType" "LabSpecimenType" NOT NULL DEFAULT 'BLOOD',
ADD COLUMN "collectionInstructions" TEXT,
ADD COLUMN "turnaroundHours" INTEGER;

-- AlterTable
ALTER TABLE "LabRequest" ADD COLUMN "requestNo" TEXT,
ADD COLUMN "priority" "LabPriority" NOT NULL DEFAULT 'ROUTINE',
ADD COLUMN "clinicalIndication" TEXT,
ADD COLUMN "specimenType" "LabSpecimenType",
ADD COLUMN "specimenId" TEXT,
ADD COLUMN "collectionDate" TIMESTAMP(3),
ADD COLUMN "collectedAt" TIMESTAMP(3),
ADD COLUMN "collectedBy" TEXT,
ADD COLUMN "processedAt" TIMESTAMP(3),
ADD COLUMN "externalLab" TEXT,
ADD COLUMN "rejectionReason" "LabRejectionReason",
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectedBy" TEXT,
ADD COLUMN "criticalFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "criticalNotedAt" TIMESTAMP(3),
ADD COLUMN "criticalNotedBy" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "releasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LabResult" ADD COLUMN "valueNumeric" DECIMAL(65,30),
ADD COLUMN "flag" "LabResultFlag",
ADD COLUMN "method" TEXT,
ADD COLUMN "comments" TEXT,
ADD COLUMN "amendedBy" TEXT,
ADD COLUMN "amendedAt" TIMESTAMP(3),
ADD COLUMN "amendmentCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "LabTestCategory_clinicId_code_key" ON "LabTestCategory"("clinicId", "code");

-- CreateIndex
CREATE INDEX "LabTestCategory_clinicId_sortOrder_idx" ON "LabTestCategory"("clinicId", "sortOrder");

-- CreateIndex
CREATE INDEX "LabTest_clinicId_categoryId_idx" ON "LabTest"("clinicId", "categoryId");

-- CreateIndex
CREATE INDEX "LabReferenceRange_testId_idx" ON "LabReferenceRange"("testId");

-- CreateIndex
CREATE INDEX "LabResultAmendment_resultId_idx" ON "LabResultAmendment"("resultId");

-- CreateIndex
CREATE INDEX "LabQcRecord_clinicId_recordedAt_idx" ON "LabQcRecord"("clinicId", "recordedAt");

-- CreateIndex
CREATE INDEX "LabEquipment_clinicId_idx" ON "LabEquipment"("clinicId");

-- CreateIndex
CREATE INDEX "LabEquipmentMaintenance_equipmentId_idx" ON "LabEquipmentMaintenance"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "LabRequest_clinicId_requestNo_key" ON "LabRequest"("clinicId", "requestNo");

-- CreateIndex
CREATE INDEX "LabRequest_clinicId_priority_idx" ON "LabRequest"("clinicId", "priority");

-- AddForeignKey
ALTER TABLE "LabTestCategory" ADD CONSTRAINT "LabTestCategory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LabTestCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReferenceRange" ADD CONSTRAINT "LabReferenceRange_testId_fkey" FOREIGN KEY ("testId") REFERENCES "LabTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResultAmendment" ADD CONSTRAINT "LabResultAmendment_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "LabResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabQcRecord" ADD CONSTRAINT "LabQcRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabEquipment" ADD CONSTRAINT "LabEquipment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabEquipmentMaintenance" ADD CONSTRAINT "LabEquipmentMaintenance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "LabEquipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

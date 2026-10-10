-- CreateEnum
CREATE TYPE "TriageLevel" AS ENUM ('RESUSCITATION', 'EMERGENT', 'URGENT', 'STANDARD', 'NON_URGENT');

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN "triageLevel" "TriageLevel";
ALTER TABLE "Encounter" ADD COLUMN "triageNotes" TEXT;

-- AlterTable
ALTER TABLE "VitalSign" ADD COLUMN "encounterId" TEXT;
ALTER TABLE "VitalSign" ADD COLUMN "painScore" INTEGER;
ALTER TABLE "VitalSign" ADD COLUMN "glucose" DECIMAL(65,30);
ALTER TABLE "VitalSign" ADD COLUMN "recordedById" TEXT;

-- CreateIndex
CREATE INDEX "VitalSign_encounterId_idx" ON "VitalSign"("encounterId");

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('NEW_CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE_EXAMINATION', 'PREVENTIVE_EXAMINATION', 'TELEMEDICINE', 'PROCEDURE', 'POST_TREATMENT_REVIEW');

-- CreateEnum
CREATE TYPE "ClinicalNoteStatus" AS ENUM ('DRAFT', 'SIGNED', 'AMENDED');

-- ReplaceEncounterStatusEnum
CREATE TYPE "EncounterStatus_new" AS ENUM ('CHECKED_IN', 'TRIAGE', 'IN_CONSULTATION', 'COMPLETED', 'SIGNED', 'CANCELLED');
ALTER TABLE "Encounter" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Encounter" ALTER COLUMN "status" TYPE "EncounterStatus_new" USING (
    CASE "status"::text
        WHEN 'IN_PROGRESS' THEN 'IN_CONSULTATION'
        WHEN 'COMPLETED' THEN 'COMPLETED'
        WHEN 'CANCELLED' THEN 'CANCELLED'
        ELSE 'IN_CONSULTATION'
    END
)::"EncounterStatus_new";
ALTER TABLE "Encounter" ALTER COLUMN "status" SET DEFAULT 'CHECKED_IN';
DROP TYPE "EncounterStatus";
ALTER TYPE "EncounterStatus_new" RENAME TO "EncounterStatus";

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN "encounterNo" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "visitType" "VisitType";
ALTER TABLE "Encounter" ADD COLUMN "hpi" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "reviewOfSystems" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "physicalExamination" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "examTemplateCode" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "patientInstructions" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "followUpPlan" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "followUpDate" TIMESTAMP(3);
ALTER TABLE "Encounter" ADD COLUMN "referralSource" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "referralNotes" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "noteStatus" "ClinicalNoteStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Encounter" ADD COLUMN "signedBy" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "signedAt" TIMESTAMP(3);
ALTER TABLE "Encounter" ADD COLUMN "amendmentReason" TEXT;
ALTER TABLE "Encounter" ADD COLUMN "checkedInAt" TIMESTAMP(3);

-- Migrate visit type from the previous AppointmentType column
UPDATE "Encounter" SET "visitType" = (
    CASE "type"::text
        WHEN 'INITIAL' THEN 'NEW_CONSULTATION'
        WHEN 'FOLLOW_UP' THEN 'FOLLOW_UP'
        WHEN 'CONSULTATION' THEN 'NEW_CONSULTATION'
        WHEN 'VACCINATION' THEN 'PREVENTIVE_EXAMINATION'
        WHEN 'PROCEDURE' THEN 'PROCEDURE'
        WHEN 'RE_EVALUATION' THEN 'POST_TREATMENT_REVIEW'
        ELSE 'NEW_CONSULTATION'
    END
)::"VisitType";
ALTER TABLE "Encounter" ALTER COLUMN "visitType" SET NOT NULL;
ALTER TABLE "Encounter" ALTER COLUMN "visitType" SET DEFAULT 'NEW_CONSULTATION';
ALTER TABLE "Encounter" DROP COLUMN "type";

-- Backfill encounter numbers per clinic
UPDATE "Encounter" e SET "encounterNo" = s.rn
FROM (
    SELECT "id", 'E' || lpad((ROW_NUMBER() OVER (PARTITION BY "clinicId" ORDER BY "createdAt"))::text, 5, '0') AS rn
    FROM "Encounter"
) s
WHERE e."id" = s."id";
ALTER TABLE "Encounter" ALTER COLUMN "encounterNo" SET NOT NULL;

-- Seed encounter number sequences so new numbers do not collide
INSERT INTO "NumberSequence" ("id", "clinicId", "key", "prefix", "padLength", "currentValue", "suffix", "updatedAt")
SELECT 'seq_enc_' || "clinicId", "clinicId", 'ENCOUNTER', 'E', 5, COUNT(*), '', now()
FROM "Encounter" GROUP BY "clinicId"
ON CONFLICT ("clinicId", "key") DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "Encounter_clinicId_encounterNo_key" ON "Encounter"("clinicId", "encounterNo");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "EncounterNoteRevision" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ClinicalNoteStatus" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "amendedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncounterNoteRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncounterAttachment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "url" TEXT,
    "notes" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncounterAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTemplate" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "specialty" TEXT,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "body" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EncounterNoteRevision_encounterId_version_key" ON "EncounterNoteRevision"("encounterId", "version");
CREATE INDEX "EncounterNoteRevision_encounterId_createdAt_idx" ON "EncounterNoteRevision"("encounterId", "createdAt");
CREATE INDEX "EncounterAttachment_encounterId_createdAt_idx" ON "EncounterAttachment"("encounterId", "createdAt");
CREATE UNIQUE INDEX "ClinicalTemplate_clinicId_code_key" ON "ClinicalTemplate"("clinicId", "code");
CREATE INDEX "ClinicalTemplate_clinicId_kind_idx" ON "ClinicalTemplate"("clinicId", "kind");

-- AddForeignKey
ALTER TABLE "EncounterNoteRevision" ADD CONSTRAINT "EncounterNoteRevision_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncounterAttachment" ADD CONSTRAINT "EncounterAttachment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTemplate" ADD CONSTRAINT "ClinicalTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

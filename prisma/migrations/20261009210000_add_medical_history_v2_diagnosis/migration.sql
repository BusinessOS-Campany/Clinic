-- CreateEnum
CREATE TYPE "MedicalHistoryCategory" AS ENUM ('PREVIOUS_ILLNESS', 'CHRONIC_DISEASE', 'PREVIOUS_SURGERY', 'PREVIOUS_HOSPITALIZATION', 'FAMILY_HISTORY', 'CURRENT_MEDICATION', 'PREVIOUS_MEDICATION', 'DRUG_ALLERGY', 'FOOD_ALLERGY', 'ENVIRONMENTAL_ALLERGY', 'ADVERSE_DRUG_REACTION', 'IMMUNIZATION', 'SMOKING', 'ALCOHOL_SUBSTANCE', 'PREGNANCY_OBSTETRIC', 'DIETARY', 'OCCUPATIONAL_LIFESTYLE', 'PREVIOUS_DIAGNOSIS', 'PREVIOUS_TREATMENT');

-- CreateEnum
CREATE TYPE "HistoryVerification" AS ENUM ('PATIENT_REPORTED', 'CLINICIAN_CONFIRMED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "HistorySource" AS ENUM ('PATIENT', 'CAREGIVER', 'CLINICIAN', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "HistoryStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DiagnosisType" AS ENUM ('PRIMARY', 'SECONDARY', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "DiagnosisStatus" AS ENUM ('SUSPECTED', 'PROVISIONAL', 'CONFIRMED', 'RULED_OUT', 'RESOLVED', 'CHRONIC');

-- CreateEnum
CREATE TYPE "CodeSystem" AS ENUM ('NONE', 'ICD10', 'ICD11', 'SNOMED_CT', 'LOCAL');

-- AlterTable
ALTER TABLE "MedicalHistory" ADD COLUMN "category" "MedicalHistoryCategory" NOT NULL DEFAULT 'PREVIOUS_ILLNESS';
ALTER TABLE "MedicalHistory" ADD COLUMN "detail" TEXT;
ALTER TABLE "MedicalHistory" ADD COLUMN "medication" TEXT;
ALTER TABLE "MedicalHistory" ADD COLUMN "status" "HistoryStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "MedicalHistory" ADD COLUMN "verification" "HistoryVerification" NOT NULL DEFAULT 'PATIENT_REPORTED';
ALTER TABLE "MedicalHistory" ADD COLUMN "source" "HistorySource" NOT NULL DEFAULT 'PATIENT';
ALTER TABLE "MedicalHistory" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "MedicalHistory" ADD COLUMN "isAlert" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MedicalHistory" ADD COLUMN "alertNote" TEXT;
ALTER TABLE "MedicalHistory" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "MedicalHistory" ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MedicalHistoryRevision" (
    "id" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeNote" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalHistoryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisCatalog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "code" TEXT NOT NULL,
    "codeSystem" "CodeSystem" NOT NULL DEFAULT 'LOCAL',
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "category" TEXT,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosisCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "catalogId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "codeSystem" "CodeSystem" NOT NULL DEFAULT 'NONE',
    "description" TEXT,
    "type" "DiagnosisType" NOT NULL DEFAULT 'SECONDARY',
    "status" "DiagnosisStatus" NOT NULL DEFAULT 'SUSPECTED',
    "symptoms" TEXT,
    "clinicalFindings" TEXT,
    "supportiveResults" TEXT,
    "diagnosedOn" TIMESTAMP(3),
    "diagnosedBy" TEXT,
    "treatmentPlan" TEXT,
    "followUp" TEXT,
    "notes" TEXT,
    "isChronic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisRevision" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeNote" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalHistory_clinicId_patientId_category_idx" ON "MedicalHistory"("clinicId", "patientId", "category");

-- CreateIndex
CREATE INDEX "MedicalHistory_clinicId_patientId_isAlert_idx" ON "MedicalHistory"("clinicId", "patientId", "isAlert");

-- CreateIndex
CREATE INDEX "MedicalHistoryRevision_historyId_createdAt_idx" ON "MedicalHistoryRevision"("historyId", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosisCatalog_codeSystem_code_idx" ON "DiagnosisCatalog"("codeSystem", "code");

-- CreateIndex
CREATE INDEX "DiagnosisCatalog_nameEn_idx" ON "DiagnosisCatalog"("nameEn");

-- CreateIndex
CREATE INDEX "DiagnosisCatalog_clinicId_isActive_idx" ON "DiagnosisCatalog"("clinicId", "isActive");

-- CreateIndex
CREATE INDEX "Diagnosis_clinicId_patientId_status_idx" ON "Diagnosis"("clinicId", "patientId", "status");

-- CreateIndex
CREATE INDEX "Diagnosis_clinicId_patientId_createdAt_idx" ON "Diagnosis"("clinicId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Diagnosis_patientId_isChronic_idx" ON "Diagnosis"("patientId", "isChronic");

-- CreateIndex
CREATE INDEX "DiagnosisRevision_diagnosisId_createdAt_idx" ON "DiagnosisRevision"("diagnosisId", "createdAt");

-- AddForeignKey
ALTER TABLE "MedicalHistoryRevision" ADD CONSTRAINT "MedicalHistoryRevision_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "MedicalHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "DiagnosisCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisRevision" ADD CONSTRAINT "DiagnosisRevision_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique per-clinic Patient ID and enforce unique MRN per clinic
ALTER TABLE "Patient" ADD COLUMN "patientId" TEXT;

WITH numbered AS (
  SELECT id, row_number() OVER (PARTITION BY "clinicId" ORDER BY "createdAt", "id") AS rn
  FROM "Patient"
)
UPDATE "Patient" SET "patientId" = 'PID' || lpad(n.rn::text, 6, '0')
FROM numbered n WHERE "Patient"."id" = n.id;

ALTER TABLE "Patient" ALTER COLUMN "patientId" SET NOT NULL;

CREATE UNIQUE INDEX "Patient_clinicId_patientId_key" ON "Patient"("clinicId", "patientId");

DROP INDEX "Patient_clinicId_mrn_idx";
CREATE UNIQUE INDEX "Patient_clinicId_mrn_key" ON "Patient"("clinicId", "mrn");
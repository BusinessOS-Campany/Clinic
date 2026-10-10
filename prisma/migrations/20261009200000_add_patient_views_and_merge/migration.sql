-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "mergedIntoId" TEXT;
ALTER TABLE "Patient" ADD COLUMN "mergedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PatientView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientView_userId_patientId_key" ON "PatientView"("userId", "patientId");

-- CreateIndex
CREATE INDEX "PatientView_userId_viewedAt_idx" ON "PatientView"("userId", "viewedAt" DESC);

-- CreateIndex
CREATE INDEX "PatientView_patientId_idx" ON "PatientView"("patientId");

-- CreateIndex
CREATE INDEX "Patient_mergedIntoId_idx" ON "Patient"("mergedIntoId");

-- AddForeignKey
ALTER TABLE "PatientView" ADD CONSTRAINT "PatientView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientView" ADD CONSTRAINT "PatientView_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

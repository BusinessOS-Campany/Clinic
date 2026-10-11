# Phase 1 Implementation Spec — Diagnosis, Medication Safety, Encounter Signing

## 1. Diagnosis Management Enhancement

### 1.1 New Enums
```prisma
enum DiagnosisStatus {
  SUSPECTED
  PROVISIONAL
  CONFIRMED
  RULED_OUT
  RESOLVED
  CHRONIC
}

enum DiagnosisClassification {
  ICD10
  ICD11
  SNOMED_CT
  LOCAL
}
```

### 1.2 Enhanced EncounterDiagnosis
Add fields:
- `status` DiagnosisStatus @default(PROVISIONAL)
- `classification` DiagnosisClassification @default(ICD10)
- `codeSystem` String? // e.g., "ICD-10-CM", "SNOMED-CT"
- `description` String?
- `diagnosedBy` String? // User ID
- `diagnosedAt` DateTime?
- `clinicalFindings` String?
- `supportingLabResultIds` String[] // JSON array of LabResult IDs
- `supportingImagingIds` String[] // JSON array of ImagingRequest IDs
- `treatmentPlan` String?
- `followUp` String?
- `notes` String?
- `isDifferential` Boolean @default(false)
- `parentDiagnosisId` String? // for differential linking
- `resolvedAt` DateTime?
- `resolvedBy` String?

### 1.3 DiagnosisCatalog (admin-configurable)
```prisma
model DiagnosisCatalog {
  id            String @id @default(cuid())
  clinicId      String
  code          String
  nameAr        String
  nameEn        String
  classification DiagnosisClassification @default(ICD10)
  category      String? // e.g., "Infectious", "Cardiovascular"
  parentId      String? // for hierarchy
  isActive      Boolean @default(true)
  isStandard    Boolean @default(true) // false = local custom
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([clinicId, code])
  @@index([clinicId, classification, isActive])
}
```

### 1.4 DiagnosisAmendment (audit trail for diagnosis changes)
```prisma
model DiagnosisAmendment {
  id              String @id @default(cuid())
  clinicId        String
  diagnosisId     String
  diagnosis       EncounterDiagnosis @relation(fields: [diagnosisId], references: [id], onDelete: Cascade)
  fieldName       String // e.g., "status", "name", "code"
  oldValue        String?
  newValue        String?
  reason          String
  amendedBy       String
  amendedAt       DateTime @default(now())
  @@index([diagnosisId])
}
```

---

## 2. Medication Safety & Drug Catalog

### 2.1 DrugCatalog (comprehensive)
```prisma
model DrugCatalog {
  id              String @id @default(cuid())
  clinicId        String
  genericName     String
  genericNameAr   String?
  brandNames      String[] // JSON array
  strength        String // e.g., "500mg"
  dosageForm      String // TABLET, CAPSULE, SYRUP, INJECTION, CREAM, etc.
  route           String // ORAL, IV, IM, SC, TOPICAL, INHALATION, etc.
  atcCode         String? // WHO ATC classification
  category        String? // e.g., "Antibiotic", "Analgesic"
  manufacturer    String?
  productId       String? // GTIN/NDC
  isControlled    Boolean @default(false)
  schedule        String? // e.g., "Schedule II"
  maxDailyDose    Decimal? // mg
  maxSingleDose   Decimal? // mg
  minAge          Int? // months
  maxAge          Int? // years
  pregnancyCategory String? // A/B/C/D/X
  renalAdjustment Boolean @default(false)
  hepaticAdjustment Boolean @default(false)
  contraindications String[] // JSON array of condition codes
  monitoringRequired String[] // e.g., ["LFT", "Renal function"]
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([clinicId, genericName, strength, dosageForm])
  @@index([clinicId, category, isActive])
  @@index([clinicId, genericName])
}
```

### 2.2 DrugInteraction
```prisma
model DrugInteraction {
  id              String @id @default(cuid())
  clinicId        String
  drugId1         String // DrugCatalog ID
  drugId2         String // DrugCatalog ID
  severity        InteractionSeverity // MAJOR, MODERATE, MINOR
  mechanism       String?
  management      String? // e.g., "Monitor INR", "Avoid combination"
  evidenceLevel   String? // A/B/C
  onset           String? // Rapid, Delayed
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
  @@unique([clinicId, drugId1, drugId2])
  @@index([clinicId, severity, isActive])
}

enum InteractionSeverity {
  MAJOR
  MODERATE
  MINOR
}
```

### 2.3 Enhanced MedicalOrder (Prescription)
Add fields:
- `drugCatalogId` String? // link to DrugCatalog
- `genericName` String?
- `brandName` String?
- `strength` String?
- `dosageForm` String?
- `route` String?
- `dose` Decimal? // e.g., 500
- `doseUnit` String? // mg, ml, units
- `frequencyCode` String? // BID, TID, QID, QD, PRN, etc.
- `startDate` DateTime?
- `endDate` DateTime?
- `refills` Int @default(0)
- `refillsUsed` Int @default(0)
- `prescriptionStatus` PrescriptionStatus @default(ACTIVE)
- `dispenseAsWritten` Boolean @default(false)
- `clinicalIndication` String?
- `prescribedBy` String // User ID
- `verifiedBy` String? // Pharmacist verification
- `verifiedAt` DateTime?

```prisma
enum PrescriptionStatus {
  ACTIVE
  COMPLETED
  CANCELLED
  ON_HOLD
  EXPIRED
}
```

### 2.4 MedicationReconciliation
```prisma
model MedicationReconciliation {
  id            String @id @default(cuid())
  clinicId      String
  patientId     String
  encounterId   String?
  performedBy   String
  performedAt   DateTime @default(now())
  status        ReconciliationStatus @default(COMPLETED)
  notes         String?
  @@index([clinicId, patientId, performedAt])
}

enum ReconciliationStatus {
  COMPLETED
  IN_PROGRESS
  DISCREPANCY_FOUND
}

model ReconciliationItem {
  id                    String @id @default(cuid())
  reconciliationId      String
  reconciliation        MedicationReconciliation @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)
  drugCatalogId         String?
  medicationName        String
  dose                  String?
  frequency             String?
  route                 String?
  source                ReconciliationSource // PATIENT_REPORTED, PREVIOUS_PRESCRIPTION, PHARMACY_RECORD, CLINICIAN_ENTERED
  action                ReconciliationAction // CONTINUE, DISCONTINUE, MODIFY, HOLD
  discrepancyNote       String?
  @@index([reconciliationId])
}

enum ReconciliationSource {
  PATIENT_REPORTED
  PREVIOUS_PRESCRIPTION
  PHARMACY_RECORD
  CLINICIAN_ENTERED
}

enum ReconciliationAction {
  CONTINUE
  DISCONTINUE
  MODIFY
  HOLD
}
```

### 2.5 PrescriptionAlert (generated at order time)
```prisma
model PrescriptionAlert {
  id            String @id @default(cuid())
  clinicId      String
  orderId       String
  order         MedicalOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  alertType     AlertType
  severity      AlertSeverity
  message       String
  details       Json? // structured data: {drugId, interactingDrugId, interactionId, etc.}
  acknowledged  Boolean @default(false)
  acknowledgedBy String?
  acknowledgedAt DateTime?
  overrideReason String?
  createdAt     DateTime @default(now())
  @@index([orderId])
  @@index([clinicId, acknowledged, severity])
}

enum AlertType {
  ALLERGY
  DRUG_INTERACTION
  DUPLICATE_THERAPY
  DOSE_EXCEEDS_MAX
  CONTRAINDICATION
  PREGNANCY_WARNING
  RENAL_ADJUSTMENT
  HEPATIC_ADJUSTMENT
  AGE_INAPPROPRIATE
}

enum AlertSeverity {
  INFO
  WARNING
  CRITICAL
}
```

---

## 3. Encounter Signing, Amendments & Templates

### 3.1 Encounter Status Enhancement
Replace `EncounterStatus`:
```prisma
enum EncounterStatus {
  DRAFT
  IN_PROGRESS
  SIGNED
  AMENDED
  COMPLETED
  CANCELLED
}
```

### 3.2 EncounterSignature
```prisma
model EncounterSignature {
  id            String @id @default(cuid())
  clinicId      String
  encounterId   String @unique
  encounter     Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  signedBy      String // User ID
  signedAt      DateTime @default(now())
  signatureHash String // hash of signed content
  signatureImage String? // base64 or storage key
  @@index([clinicId, signedAt])
}
```

### 3.3 EncounterAmendment
```prisma
model EncounterAmendment {
  id            String @id @default(cuid())
  clinicId      String
  encounterId   String
  encounter     Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  amendedBy     String
  amendedAt     DateTime @default(now())
  reason        String
  previousContent Json // snapshot of changed fields
  newContent    Json
  @@index([encounterId])
}
```

### 3.4 ClinicalTemplate (specialty-specific)
```prisma
model ClinicalTemplate {
  id          String @id @default(cuid())
  clinicId    String
  departmentId String?
  name        String
  nameAr      String
  nameEn      String
  specialty   String? // e.g., "CARDIOLOGY", "DERMATOLOGY", "PEDIATRICS"
  templateType TemplateType @default(SOAP)
  structure   Json // { subjective: {fields: [...]}, objective: {...}, assessment: {...}, plan: {...} }
  isDefault   Boolean @default(false)
  isActive    Boolean @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([clinicId, departmentId, specialty, isActive])
}

enum TemplateType {
  SOAP
  PROGRESS_NOTE
  PROCEDURE_NOTE
  CONSULTATION
  DISCHARGE_SUMMARY
  REFERRAL
  CUSTOM
}
```

### 3.5 EncounterTemplateUsage (track which template used)
```prisma
model EncounterTemplateUsage {
  id            String @id @default(cuid())
  clinicId      String
  encounterId   String @unique
  encounter     Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  templateId    String
  template      ClinicalTemplate @relation(fields: [templateId], references: [id], onDelete: Restrict)
  appliedBy     String
  appliedAt     DateTime @default(now())
}
```

---

## 4. RBAC Permissions to Add

| Module | Action | Code | Description |
|--------|--------|------|-------------|
| diagnosis | manage | diagnosis:manage | Configure diagnosis catalog, statuses |
| diagnosis | read | diagnosis:read | View diagnoses |
| drug | catalog | drug:catalog | Manage drug catalog, interactions |
| drug | read | drug:read | View drug catalog |
| encounter | sign | encounter:sign | Sign clinical notes |
| encounter | amend | encounter:amend | Amend signed encounters |
| template | manage | template:manage | Manage clinical templates |
| template | read | template:read | Use clinical templates |
| reconciliation | perform | reconciliation:perform | Perform medication reconciliation |

---

## 5. CDS Warning Engine (Server-side)

### 5.1 Check Prescription Safety (called from addOrder)
```typescript
async function checkPrescriptionSafety(
  clinicId: string,
  patientId: string,
  newOrder: OrderValues,
  existingOrders: MedicalOrder[]
): Promise<PrescriptionAlert[]> {
  // 1. Allergy check (patient allergies vs new drug)
  // 2. Drug-drug interaction (new vs existing ACTIVE orders)
  // 3. Duplicate therapy (same ATC class)
  // 4. Dose limits (max daily/single dose)
  // 5. Contraindications (patient diagnoses vs drug)
  // 6. Pregnancy/renal/hepatic/age adjustments
  // Return array of alerts
}
```

### 5.2 Alert Display
- Show in EncounterChart Orders tab before submit
- Require acknowledgment for WARNING/CRITICAL
- Allow override with documented reason (if permitted by role)

---

## 6. UI Changes

### 6.1 EncounterChart Tabs (add)
- "Safety" tab showing active prescription alerts
- Diagnosis status dropdown (SUSPECTED→CONFIRMED→RESOLVED etc.)
- Treatment plan / follow-up fields per diagnosis
- Sign button (when complete)
- Amendment history panel

### 6.2 New Admin Pages
- `/diagnoses/catalog` — ICD-10/SNOMED/local catalog management
- `/drugs/catalog` — Drug catalog + interaction matrix
- `/templates` — Clinical template builder per specialty

### 6.3 Patient Profile
- Diagnosis tab: show status badges, treatment plan, follow-up
- Medications tab: safety alerts banner, reconciliation button

---

## 7. Migration Strategy

1. Add new fields to `EncounterDiagnosis` with defaults
2. Add new fields to `MedicalOrder` with defaults
3. Create new models: `DiagnosisCatalog`, `DiagnosisAmendment`, `DrugCatalog`, `DrugInteraction`, `PrescriptionAlert`, `MedicationReconciliation`, `ReconciliationItem`, `EncounterSignature`, `EncounterAmendment`, `ClinicalTemplate`, `EncounterTemplateUsage`
4. Update `EncounterStatus` enum (DRAFT, IN_PROGRESS, SIGNED, AMENDED, COMPLETED, CANCELLED)
5. Backfill: existing encounters → IN_PROGRESS; completed → SIGNED
6. Seed: ICD-10 top 500 codes, common drug interactions

---

## 8. API Actions to Add/Modify

### Diagnosis
- `updateDiagnosisStatus(id, status)` — with amendment record
- `addDiagnosisAmendment(diagnosisId, field, old, new, reason)`
- `createDiagnosisCatalogEntry(...)` / `update` / `delete` / `importICD10`
- `getDiagnosisCatalog(search, classification)`

### Drug Catalog
- `createDrugCatalogEntry(...)` / `update` / `delete`
- `createDrugInteraction(drugId1, drugId2, severity, ...)`
- `checkPrescriptionSafety(patientId, newOrder)` — returns alerts
- `acknowledgeAlert(alertId, overrideReason?)`

### Encounter
- `signEncounter(id)` — creates EncounterSignature, locks fields
- `amendEncounter(id, changes, reason)` — creates EncounterAmendment, updates encounter
- `createTemplate(...)`, `updateTemplate`, `deleteTemplate`, `getTemplates(departmentId?)`
- `applyTemplate(encounterId, templateId)`

### Reconciliation
- `startReconciliation(patientId, encounterId?)`
- `addReconciliationItem(...)`
- `completeReconciliation(reconciliationId)`

---

## 9. Translation Keys to Add

### English (en.json) — partial list
```json
{
  "diagnosis": {
    "status": "Status",
    "status_SUSPECTED": "Suspected",
    "status_PROVISIONAL": "Provisional",
    "status_CONFIRMED": "Confirmed",
    "status_RULED_OUT": "Ruled Out",
    "status_RESOLVED": "Resolved",
    "status_CHRONIC": "Chronic",
    "classification": "Classification",
    "classification_ICD10": "ICD-10",
    "classification_ICD11": "ICD-11",
    "classification_SNOMED_CT": "SNOMED CT",
    "classification_LOCAL": "Local",
    "treatmentPlan": "Treatment Plan",
    "followUp": "Follow-up",
    "clinicalFindings": "Clinical Findings",
    "supportingResults": "Supporting Results",
    "isDifferential": "Differential Diagnosis",
    "catalog": "Diagnosis Catalog",
    "catalogCode": "Code",
    "catalogName": "Name",
    "amendment": "Amendment",
    "amendmentReason": "Reason for Amendment"
  },
  "drug": {
    "catalog": "Drug Catalog",
    "genericName": "Generic Name",
    "brandName": "Brand Name",
    "strength": "Strength",
    "dosageForm": "Dosage Form",
    "route": "Route",
    "atcCode": "ATC Code",
    "maxDailyDose": "Max Daily Dose",
    "maxSingleDose": "Max Single Dose",
    "pregnancyCategory": "Pregnancy Category",
    "renalAdjustment": "Renal Adjustment Required",
    "hepaticAdjustment": "Hepatic Adjustment Required",
    "interactions": "Interactions",
    "interactionSeverity_MAJOR": "Major",
    "interactionSeverity_MODERATE": "Moderate",
    "interactionSeverity_MINOR": "Minor",
    "alert": "Prescription Alert",
    "alertType_ALLERGY": "Allergy",
    "alertType_DRUG_INTERACTION": "Drug Interaction",
    "alertType_DUPLICATE_THERAPY": "Duplicate Therapy",
    "alertType_DOSE_EXCEEDS_MAX": "Dose Exceeds Maximum",
    "alertType_CONTRAINDICATION": "Contraindication",
    "alertType_PREGNANCY_WARNING": "Pregnancy Warning",
    "alertType_RENAL_ADJUSTMENT": "Renal Adjustment Needed",
    "alertType_HEPATIC_ADJUSTMENT": "Hepatic Adjustment Needed",
    "alertType_AGE_INAPPROPRIATE": "Age Inappropriate",
    "acknowledge": "Acknowledge",
    "overrideReason": "Override Reason",
    "reconciliation": "Medication Reconciliation",
    "reconciliationSource_PATIENT_REPORTED": "Patient Reported",
    "reconciliationSource_PREVIOUS_PRESCRIPTION": "Previous Prescription",
    "reconciliationSource_PHARMACY_RECORD": "Pharmacy Record",
    "reconciliationSource_CLINICIAN_ENTERED": "Clinician Entered",
    "reconciliationAction_CONTINUE": "Continue",
    "reconciliationAction_DISCONTINUE": "Discontinue",
    "reconciliationAction_MODIFY": "Modify",
    "reconciliationAction_HOLD": "Hold"
  },
  "encounter": {
    "status_DRAFT": "Draft",
    "status_SIGNED": "Signed",
    "status_AMENDED": "Amended",
    "sign": "Sign Note",
    "signedBy": "Signed By",
    "signedAt": "Signed At",
    "amend": "Amend",
    "amendmentReason": "Amendment Reason",
    "amendmentHistory": "Amendment History",
    "template": "Clinical Template",
    "templateType_SOAP": "SOAP Note",
    "templateType_PROGRESS_NOTE": "Progress Note",
    "templateType_PROCEDURE_NOTE": "Procedure Note",
    "templateType_CONSULTATION": "Consultation",
    "templateType_DISCHARGE_SUMMARY": "Discharge Summary",
    "templateType_REFERRAL": "Referral",
    "applyTemplate": "Apply Template"
  }
}
```

---

## 10. Implementation Order

1. **Schema & Migration** (Day 1)
2. **RBAC & Seed** (Day 1)
3. **Diagnosis Catalog + Enhanced EncounterDiagnosis** (Days 2-4)
4. **Drug Catalog + Interaction Engine** (Days 5-8)
5. **Prescription Safety Checks + Alerts** (Days 9-11)
6. **Encounter Signing + Amendments** (Days 12-14)
7. **Clinical Templates** (Days 15-16)
8. **UI Integration** (Days 17-20)
9. **Translations + Tests + Build** (Days 21)

---

## 11. Files to Modify/Create

### New Files
- `prisma/schema.prisma` — extended
- `src/app/[locale]/(app)/diagnoses/catalog/` — catalog admin pages
- `src/app/[locale]/(app)/drugs/catalog/` — drug catalog admin
- `src/app/[locale]/(app)/templates/` — template admin
- `src/app/[locale]/(app)/encounters/safety-actions.ts` — prescription safety
- `src/app/[locale]/(app)/encounters/sign-actions.ts` — sign/amend
- `src/components/diagnoses/` — diagnosis components
- `src/components/drugs/` — drug catalog components
- `src/components/templates/` — template builder
- `src/core/cds/` — clinical decision support engine
- `src/lib/drug-catalog/` — drug catalog utilities

### Modified Files
- `src/app/[locale]/(app)/encounters/actions.ts` — add diagnosis status, treatment plan, sign, amend
- `src/app/[locale]/(app)/encounters/schema.ts` — extended schemas
- `src/components/encounters/encounter-chart.tsx` — new tabs, safety alerts, sign/amend UI
- `src/components/patients/profile/tabs/diagnoses-tab.tsx` — enhanced display
- `src/components/patients/profile/tabs/medications-tab.tsx` — safety alerts
- `src/core/rbac/catalog.ts` — new permissions
- `src/messages/en.json`, `ar.json` — translations
- `prisma/seed.ts` — seed ICD-10, drug interactions
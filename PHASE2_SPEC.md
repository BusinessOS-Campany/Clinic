# Phase 2 Implementation Spec — Clinical Templates, Medication Reconciliation, Vital Signs

## 1. Clinical Templates Enhancement

### 1.1 Enhanced ClinicalTemplate Structure
The `structure` JSON field should support:
```json
{
  "sections": [
    {
      "id": "subjective",
      "labelKey": "tabSubjective",
      "type": "textarea",
      "required": false,
      "placeholderKey": "chiefComplaint",
      "fields": [
        { "id": "chiefComplaint", "labelKey": "chiefComplaint", "type": "text", "required": true },
        { "id": "hpi", "labelKey": "hpi", "type": "textarea", "required": false }
      ]
    },
    {
      "id": "objective",
      "labelKey": "tabObjective",
      "type": "vitals",
      "fields": ["temperature", "pulse", "bp", "spO2", "weight", "height", "bmi"]
    },
    {
      "id": "assessment",
      "labelKey": "tabAssessment",
      "type": "textarea",
      "required": true
    },
    {
      "id": "plan",
      "labelKey": "tabPlan",
      "type": "textarea",
      "required": true
    }
  ],
  "vitalThresholds": {
    "temperature": { "min": 35, "max": 39, "unit": "C" },
    "pulse": { "min": 50, "max": 120, "unit": "bpm" },
    "bpSystolic": { "min": 90, "max": 160, "unit": "mmHg" },
    "spO2": { "min": 94, "max": 100, "unit": "%" }
  }
}
```

### 1.2 Template Actions to Add/Extend
- `createClinicalTemplate(values)` — with structure validation
- `updateClinicalTemplate(id, values)`
- `deleteClinicalTemplate(id)`
- `getClinicalTemplates(departmentId?, specialty?)`
- `applyClinicalTemplate(encounterId, templateId)` — populates encounter fields from template
- `previewTemplate(templateId)` — returns structure for UI preview

### 1.3 Template Admin UI (`/templates`)
- List view with search/filter by department/specialty
- Create/Edit modal with visual section builder
- Drag-drop section reordering
- Field palette (text, textarea, select, number, date, vitals group)
- Vital threshold configuration per template
- Set as department default

---

## 2. Medication Reconciliation UI

### 2.1 Workflow
```
Start Reconciliation → Add/Import Items → Set Actions → Complete → Lock
```

### 2.2 Actions
- `startReconciliation(patientId, encounterId?)` — creates MedicationReconciliation record
- `addReconciliationItem(reconciliationId, values)` — adds one medication line
- `bulkImportReconciliation(reconciliationId, source)` — imports from: current orders, previous prescriptions, pharmacy records, patient-reported
- `updateReconciliationItem(itemId, values)` — updates action (CONTINUE/DISCONTINUE/MODIFY/HOLD)
- `completeReconciliation(reconciliationId)` — locks, generates orders for CONTINUE/MODIFY
- `getReconciliation(reconciliationId)` — with items

### 2.3 Reconciliation UI (`/patients/[id]/reconciliation` or modal from EncounterChart)
- Start button (requires `reconciliation:perform`)
- Source tabs: Current Meds, Previous Rx, Pharmacy, Patient-Reported
- Item rows: drug selector (catalog), dose/freq/route, source badge, action dropdown
- Bulk actions: mark all CONTINUE, auto-discontinue expired
- Complete button → creates/updates MedicalOrders per item

---

## 3. Vital Signs as Discrete Records

### 3.1 New Model: VitalSign
```prisma
model VitalSign {
  id          String   @id @default(cuid())
  clinicId    String
  patientId   String
  encounterId String?
  recordedBy  String
  recordedAt  DateTime @default(now())
  // Core vitals
  temperature Decimal?
  pulse       Int?
  respRate    Int?
  bpSystolic  Int?
  bpDiastolic Int?
  spO2        Int?
  height      Decimal?
  weight      Decimal?
  bmi         Decimal?
  painScore   Int?          // 0-10
  glucose     Decimal?      // mg/dL
  headCircumference Decimal? // cm
  // Metadata
  position    VitalPosition? // SITTING, STANDING, SUPINE
  device      String?       // e.g., "Welch Allyn 6000"
  notes       String?
  isManual    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([clinicId, patientId, recordedAt])
  @@index([encounterId])
}

enum VitalPosition {
  SITTING
  STANDING
  SUPINE
  LEFT_LATERAL
  RIGHT_LATERAL
}
```

### 3.2 Alert Thresholds (Configurable)
```prisma
model VitalAlertRule {
  id            String         @id @default(cuid())
  clinicId      String
  vitalType     VitalType      // TEMPERATURE, PULSE, BP_SYSTOLIC, BP_DIASTOLIC, SPO2, PAIN, GLUCOSE
  ageMin        Int?           // months
  ageMax        Int?           // months
  sex           Sex?           // MALE, FEMALE
  conditionCode String?        // e.g., "HTN", "DM"
  minValue      Decimal?
  maxValue      Decimal?
  severity      AlertSeverity  // INFO, WARNING, CRITICAL
  message       String
  isActive      Boolean @default(true)

  @@index([clinicId, vitalType, isActive])
}

enum VitalType {
  TEMPERATURE
  PULSE
  RESP_RATE
  BP_SYSTOLIC
  BP_DIASTOLIC
  SPO2
  PAIN
  GLUCOSE
  BMI
  HEIGHT
  WEIGHT
  HEAD_CIRCUMFERENCE
}
```

### 3.3 Vital Signs Actions
- `recordVitalSigns(encounterId?, values)` — creates VitalSign, evaluates alerts
- `getVitalSigns(patientId, options?)` — with date range, type filter
- `getVitalTrends(patientId, vitalType, days)` — for charting
- `getActiveVitalAlerts(patientId)` — unresolved alerts
- `acknowledgeVitalAlert(alertId, userId)` — marks acknowledged

### 3.4 UI Components
- **EncounterChart Vitals Tab**: Discrete entry form (replaces inline fields), shows last 5 readings
- **Patient Profile Vitals Tab**: Chart.js line charts per vital type, date range picker, export CSV
- **Alert Banner**: Shows active CRITICAL/WARNING alerts at top of encounter/patient views
- **Threshold Admin** (`/settings/vitals`): Configure rules per age/sex/condition

---

## 4. EncounterChart Integration

### 4.1 New Toolbar Buttons
- **Apply Template** — opens template selector, populates SOAP/vitals
- **Start Reconciliation** — opens reconciliation modal
- **Vitals Chart** — new tab with interactive charts

### 4.2 Vitals Chart Tab
- Recharts line charts for each vital type
- Multi-vital overlay toggle
- Reference range shading (green/yellow/red zones)
- Hover tooltip with exact value, time, recorder
- Export PNG/CSV

---

## 5. RBAC Permissions to Add

| Module | Action | Code |
|--------|--------|------|
| template | manage | template:manage |
| template | read | template:read |
| reconciliation | perform | reconciliation:perform |
| reconciliation | read | reconciliation:read |
| vitals | record | vitals:record |
| vitals | read | vitals:read |
| vitals | configure | vitals:configure |
| alert | acknowledge | alert:acknowledge |

---

## 6. Translation Keys to Add

### English (partial)
```json
{
  "template": {
    "title": "Clinical Templates",
    "builder": "Template Builder",
    "sections": "Sections",
    "fields": "Fields",
    "addSection": "Add Section",
    "sectionTypes": { "text": "Text", "textarea": "Text Area", "select": "Dropdown", "number": "Number", "date": "Date", "vitals": "Vitals Group" },
    "vitalThresholds": "Vital Alert Thresholds",
    "applyTemplate": "Apply Template",
    "templateApplied": "Template applied",
    "defaultForDepartment": "Default for Department"
  },
  "reconciliation": {
    "title": "Medication Reconciliation",
    "start": "Start Reconciliation",
    "sources": { "current": "Current Medications", "previous": "Previous Prescriptions", "pharmacy": "Pharmacy Records", "patient": "Patient Reported" },
    "actions": { "CONTINUE": "Continue", "DISCONTINUE": "Discontinue", "MODIFY": "Modify", "HOLD": "Hold" },
    "complete": "Complete Reconciliation",
    "completed": "Reconciliation completed",
    "items": "Items",
    "noItems": "No medications to reconcile"
  },
  "vitals": {
    "title": "Vital Signs",
    "record": "Record Vitals",
    "position": "Position",
    "position_SITTING": "Sitting",
    "position_STANDING": "Standing",
    "position_SUPINE": "Supine",
    "painScore": "Pain Score (0-10)",
    "glucose": "Blood Glucose",
    "headCircumference": "Head Circumference",
    "device": "Device",
    "charts": "Trends",
    "alerts": "Vital Alerts",
    "thresholds": "Alert Thresholds",
    "ageRange": "Age Range",
    "condition": "Condition"
  }
}
```

---

## 7. Implementation Order

1. **Schema & Migration** (Day 1): Add VitalSign, VitalAlertRule, enhance ClinicalTemplate structure
2. **RBAC & Seed** (Day 1): Permissions, default templates, default alert rules
3. **Clinical Template Builder** (Days 2-4): Admin UI with visual editor
4. **Medication Reconciliation** (Days 5-7): Start→Items→Complete workflow
5. **Vital Signs Model + Actions** (Days 8-10): Discrete records, alert engine
6. **Vitals Chart Component** (Days 11-12): Recharts integration
7. **EncounterChart Integration** (Days 13-14): Toolbar buttons, new tabs
8. **Patient Profile Vitals Tab** (Day 15): Charts + alert banner
9. **Translations + Tests + Build** (Days 16-17)

---

## 8. Files to Create/Modify

### New
- `src/app/[locale]/(app)/templates/` — Template builder pages
- `src/app/[locale]/(app)/reconciliation/` — Reconciliation actions/pages
- `src/app/[locale]/(app)/vitals/` — Vital signs actions
- `src/components/templates/` — Template builder components
- `src/components/reconciliation/` — Reconciliation UI
- `src/components/vitals/` — Vital sign entry, charts, alerts
- `src/core/vitals/` — Alert evaluation engine

### Modified
- `prisma/schema.prisma` — VitalSign, VitalAlertRule, ClinicalTemplate structure
- `src/core/rbac/catalog.ts` — New permissions
- `src/app/[locale]/(app)/encounters/actions.ts` — Template apply, reconciliation start
- `src/components/encounters/encounter-chart.tsx` — New toolbar, tabs
- `src/components/patients/profile/tabs/vitals-tab.tsx` — Charts + alerts
- `src/messages/en.json`, `ar.json` — Translations
- `prisma/seed.ts` — Default templates, alert rules
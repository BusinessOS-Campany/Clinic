import "dotenv/config";
import { prisma } from "../src/lib/db";
import { auth } from "../src/core/auth/server";
import {
  PERMISSION_CATALOG,
  ROLE_CODES,
  ROLE_PERMISSIONS,
  type RoleCode,
} from "../src/core/rbac/catalog";

const ROLE_NAMES: Record<RoleCode, { ar: string; en: string }> = {
  super_admin: { ar: "مدير النظام", en: "Platform Administrator" },
  manager: { ar: "مدير العيادة", en: "Clinic Manager" },
  receptionist: { ar: "موظف استقبال", en: "Receptionist" },
  physician: { ar: "طبيب", en: "Physician" },
  nurse: { ar: "ممرض / فرز", en: "Nurse / Triage" },
  lab_tech: { ar: "فني مختبر", en: "Laboratory Technician" },
  lab_reviewer: { ar: "مراجع مختبر", en: "Laboratory Reviewer" },
  imaging_tech: { ar: "فني أشعة", en: "Radiology Technician" },
  pharmacist: { ar: "صيدلي", en: "Pharmacist" },
  cashier: { ar: "كاشير", en: "Cashier" },
  accountant: { ar: "محاسب", en: "Accountant" },
  procurement: { ar: "مسؤول مشتريات", en: "Procurement Officer" },
  inventory: { ar: "مدير مخزون", en: "Inventory Manager" },
  insurance: { ar: "موظف تأمين", en: "Insurance Officer" },
  auditor: { ar: "مدقق", en: "Auditor" },
};

const DEFAULT_TEMPLATES = [
  {
    name: "Standard SOAP Note",
    nameAr: "ملاحظة SOAP قياسية",
    nameEn: "Standard SOAP Note",
    specialty: "GENERAL",
    templateType: "SOAP",
    structure: {
      sections: [
        {
          id: "subjective",
          labelKey: "tabSubjective",
          type: "textarea",
          required: false,
          fields: [
            { id: "chiefComplaint", labelKey: "chiefComplaint", type: "text", required: true },
            { id: "hpi", labelKey: "hpi", type: "textarea", required: false, placeholderKey: "hpiPlaceholder" },
            { id: "ros", labelKey: "ros", type: "textarea", required: false, placeholderKey: "rosPlaceholder" }
          ]
        },
        {
          id: "objective",
          labelKey: "tabObjective",
          type: "vitals",
          fields: ["temperature", "pulse", "bp", "spO2", "weight", "height", "bmi", "respRate"]
        },
        {
          id: "assessment",
          labelKey: "tabAssessment",
          type: "textarea",
          required: true
        },
        {
          id: "plan",
          labelKey: "tabPlan",
          type: "textarea",
          required: true
        }
      ],
      vitalThresholds: {
        temperature: { min: 35, max: 39, unit: "C" },
        pulse: { min: 50, max: 120, unit: "bpm" },
        bpSystolic: { min: 90, max: 160, unit: "mmHg" },
        bpDiastolic: { min: 60, max: 100, unit: "mmHg" },
        spO2: { min: 94, max: 100, unit: "%" }
      }
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Progress Note",
    nameAr: "ملاحظة متابعة",
    nameEn: "Progress Note",
    specialty: "GENERAL",
    templateType: "PROGRESS_NOTE",
    structure: {
      sections: [
        {
          id: "subjective",
          labelKey: "intervalHistory",
          type: "textarea",
          required: true
        },
        {
          id: "objective",
          labelKey: "tabObjective",
          type: "vitals",
          fields: ["temperature", "pulse", "bp", "spO2", "weight"]
        },
        {
          id: "assessment",
          labelKey: "tabAssessment",
          type: "textarea",
          required: true
        },
        {
          id: "plan",
          labelKey: "tabPlan",
          type: "textarea",
          required: true
        }
      ],
      vitalThresholds: {
        temperature: { min: 35, max: 39, unit: "C" },
        pulse: { min: 50, max: 120, unit: "bpm" },
        bpSystolic: { min: 90, max: 160, unit: "mmHg" },
        spO2: { min: 94, max: 100, unit: "%" }
      }
    },
    isDefault: false,
    isActive: true
  },
  {
    name: "Procedure Note",
    nameAr: "ملاحظة إجراء",
    nameEn: "Procedure Note",
    specialty: "GENERAL",
    templateType: "PROCEDURE_NOTE",
    structure: {
      sections: [
        {
          id: "indication",
          labelKey: "indication",
          type: "textarea",
          required: true
        },
        {
          id: "procedure",
          labelKey: "procedureDetails",
          type: "textarea",
          required: true
        },
        {
          id: "findings",
          labelKey: "findings",
          type: "textarea",
          required: false
        },
        {
          id: "complications",
          labelKey: "complications",
          type: "textarea",
          required: false
        },
        {
          id: "postProcedure",
          labelKey: "postProcedureInstructions",
          type: "textarea",
          required: true
        }
      ]
    },
    isDefault: false,
    isActive: true
  },
  {
    name: "Discharge Summary",
    nameAr: "ملخص خروج",
    nameEn: "Discharge Summary",
    specialty: "GENERAL",
    templateType: "DISCHARGE_SUMMARY",
    structure: {
      sections: [
        {
          id: "admissionDiagnosis",
          labelKey: "admissionDiagnosis",
          type: "textarea",
          required: true
        },
        {
          id: "hospitalCourse",
          labelKey: "hospitalCourse",
          type: "textarea",
          required: true
        },
        {
          id: "dischargeDiagnosis",
          labelKey: "dischargeDiagnosis",
          type: "textarea",
          required: true
        },
        {
          id: "dischargeMeds",
          labelKey: "dischargeMedications",
          type: "textarea",
          required: true
        },
        {
          id: "followUp",
          labelKey: "followUpInstructions",
          type: "textarea",
          required: true
        }
      ]
    },
    isDefault: false,
    isActive: true
  }
];

const DEFAULT_VITAL_ALERT_RULES = [
  { vitalType: "TEMPERATURE", ageMin: 0, ageMax: 36, sex: null, conditionCode: null, minValue: 35, maxValue: 38.5, severity: "WARNING", message: "Temperature outside normal range for age" },
  { vitalType: "TEMPERATURE", ageMin: 0, ageMax: 36, sex: null, conditionCode: null, minValue: null, maxValue: 39.5, severity: "CRITICAL", message: "High fever - urgent evaluation needed" },
  { vitalType: "TEMPERATURE", ageMin: 36, ageMax: null, sex: null, conditionCode: null, minValue: 35, maxValue: 38.0, severity: "WARNING", message: "Temperature outside normal adult range" },
  { vitalType: "TEMPERATURE", ageMin: 36, ageMax: null, sex: null, conditionCode: null, minValue: null, maxValue: 39.0, severity: "CRITICAL", message: "High fever - urgent evaluation needed" },
  { vitalType: "PULSE", ageMin: 0, ageMax: 12, sex: null, conditionCode: null, minValue: 80, maxValue: 160, severity: "WARNING", message: "Heart rate outside normal range for infant/child" },
  { vitalType: "PULSE", ageMin: 12, ageMax: null, sex: null, conditionCode: null, minValue: 50, maxValue: 100, severity: "WARNING", message: "Heart rate outside normal adult range" },
  { vitalType: "PULSE", ageMin: 12, ageMax: null, sex: null, conditionCode: null, minValue: null, maxValue: 130, severity: "CRITICAL", message: "Significant tachycardia - evaluate urgently" },
  { vitalType: "BP_SYSTOLIC", ageMin: 0, ageMax: 12, sex: null, conditionCode: null, minValue: 80, maxValue: 120, severity: "WARNING", message: "Blood pressure outside normal range for child" },
  { vitalType: "BP_SYSTOLIC", ageMin: 12, ageMax: null, sex: null, conditionCode: null, minValue: 90, maxValue: 140, severity: "WARNING", message: "Blood pressure outside normal adult range" },
  { vitalType: "BP_SYSTOLIC", ageMin: 12, ageMax: null, sex: null, conditionCode: null, minValue: null, maxValue: 180, severity: "CRITICAL", message: "Hypertensive urgency - evaluate immediately" },
  { vitalType: "BP_DIASTOLIC", ageMin: 12, ageMax: null, sex: null, conditionCode: null, minValue: 60, maxValue: 90, severity: "WARNING", message: "Diastolic BP outside normal range" },
  { vitalType: "BP_DIASTOLIC", ageMin: 12, ageMax: null, sex: null, conditionCode: null, minValue: null, maxValue: 110, severity: "CRITICAL", message: "Diastolic hypertension - evaluate urgently" },
  { vitalType: "SPO2", ageMin: 0, ageMax: null, sex: null, conditionCode: null, minValue: 94, maxValue: 100, severity: "WARNING", message: "Oxygen saturation below normal" },
  { vitalType: "SPO2", ageMin: 0, ageMax: null, sex: null, conditionCode: null, minValue: 90, maxValue: null, severity: "CRITICAL", message: "Severe hypoxemia - immediate intervention required" },
  { vitalType: "PAIN", ageMin: 0, ageMax: null, sex: null, conditionCode: null, minValue: null, maxValue: 6, severity: "WARNING", message: "Severe pain - reassess analgesia" },
  { vitalType: "GLUCOSE", ageMin: 0, ageMax: null, sex: null, conditionCode: "DM", minValue: 70, maxValue: 180, severity: "WARNING", message: "Blood glucose outside target range for diabetes" },
  { vitalType: "GLUCOSE", ageMin: 0, ageMax: null, sex: null, conditionCode: "DM", minValue: null, maxValue: 250, severity: "CRITICAL", message: "Severe hyperglycemia - check ketones" },
  { vitalType: "GLUCOSE", ageMin: 0, ageMax: null, sex: null, conditionCode: null, minValue: 70, maxValue: 110, severity: "WARNING", message: "Fasting glucose outside normal range" },
  { vitalType: "GLUCOSE", ageMin: 0, ageMax: null, sex: null, conditionCode: null, minValue: 60, maxValue: null, severity: "CRITICAL", message: "Hypoglycemia - immediate treatment needed" }
];

async function seed() {
  console.log("Seeding permissions...");
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        module: p.module,
        action: p.action,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
      },
      update: {
        module: p.module,
        action: p.action,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
      },
    });
  }
  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const permissionIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  console.log("Seeding roles...");
  const roleIds = new Map<string, string>();
  for (const code of ROLE_CODES) {
    const names = ROLE_NAMES[code];
    const role = await prisma.role.upsert({
      where: { code },
      create: {
        code,
        nameAr: names.ar,
        nameEn: names.en,
        description: `System role: ${names.en}`,
        isSystem: true,
      },
      update: { nameAr: names.ar, nameEn: names.en },
    });
    roleIds.set(code, role.id);
  }

  console.log("Seeding role permissions...");
  for (const [code, grants] of Object.entries(ROLE_PERMISSIONS) as [
    RoleCode,
    string[],
  ][]) {
    const roleId = roleIds.get(code);
    if (!roleId) continue;
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    const data = grants
      .map((perm) => {
        const permissionId = permissionIdByCode.get(perm);
        return permissionId ? { roleId, permissionId } : null;
      })
      .filter((x): x is { roleId: string; permissionId: string } => x !== null);
    if (data.length) await prisma.rolePermission.createMany({ data });
  }

  console.log("Seeding default clinic...");
  const clinic = await prisma.clinic.upsert({
    where: { code: "MAIN" },
    create: {
      code: "MAIN",
      nameAr: "العيادة الرئيسية",
      nameEn: "Main Clinic",
      currency: "YER",
      timezone: "Asia/Aden",
      locale: "ar",
      dateFormat: "dd/MM/yyyy",
    },
    update: {},
  });

  for (const key of ["PATIENT", "ENCOUNTER", "VISIT", "INVOICE", "RECEIPT", "QUEUE"]) {
    await prisma.numberSequence.upsert({
      where: { clinicId_key: { clinicId: clinic.id, key } },
      create: { clinicId: clinic.id, key, prefix: key === "PATIENT" ? "P" : "", currentValue: 0n, padLength: 5 },
      update: {},
    });
  }

  console.log("Seeding default queues...");
  const defaultQueues = [
    { code: "TRIAGE", nameAr: "الفرز والعلامات الحيوية", nameEn: "Triage & Vitals", kind: "TRIAGE" },
    { code: "DOCTOR", nameAr: "طابور الأطباء", nameEn: "Doctor Queue", kind: "DOCTOR" },
  ];
  for (const q of defaultQueues) {
    await prisma.queue.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: q.code } },
      create: {
        clinicId: clinic.id,
        code: q.code,
        nameAr: q.nameAr,
        nameEn: q.nameEn,
        kind: q.kind as any,
      },
      update: { nameAr: q.nameAr, nameEn: q.nameEn, kind: q.kind as any },
    });
  }

  console.log("Seeding admin user...");
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@clinic.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin";
  const superAdminRoleId = roleIds.get("super_admin");
  if (!superAdminRoleId) throw new Error("super_admin role missing");

  const existing = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: "Admin",
        username: adminUsername,
        nameAr: "مدير النظام",
        roleId: superAdminRoleId,
        currentClinicId: clinic.id,
        clinicId: clinic.id,
      },
    });
    console.log(`Admin created: ${adminUsername}`);
  } else {
    console.log(`Admin already exists: ${adminUsername}`);
  }

  console.log("Seeding clinical templates...");
  const adminUser = await prisma.user.findUnique({ where: { username: adminUsername } });
  const adminId = adminUser?.id;
  for (const t of DEFAULT_TEMPLATES) {
    await prisma.clinicalTemplate.upsert({
      where: { clinicId_name: { clinicId: clinic.id, name: t.name } },
      create: {
        clinicId: clinic.id,
        name: t.name,
        nameAr: t.nameAr,
        nameEn: t.nameEn,
        specialty: t.specialty,
        templateType: t.templateType as any,
        structure: t.structure,
        isDefault: t.isDefault,
        isActive: t.isActive,
        createdBy: adminId,
      },
      update: { structure: t.structure, isDefault: t.isDefault, isActive: t.isActive },
    });
  }

  console.log("Seeding vital alert rules...");
  await prisma.vitalAlertRule.deleteMany({ where: { clinicId: clinic.id } });
  await prisma.vitalAlertRule.createMany({
    data: DEFAULT_VITAL_ALERT_RULES.map((rule) => ({
      clinicId: clinic.id,
      vitalType: rule.vitalType as any,
      ageMin: rule.ageMin ?? null,
      ageMax: rule.ageMax ?? null,
      sex: rule.sex ?? null,
      conditionCode: rule.conditionCode ?? null,
      minValue: rule.minValue ?? null,
      maxValue: rule.maxValue ?? null,
      severity: rule.severity as any,
      message: rule.message,
      isActive: true,
    })),
  });

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { auth } from "../src/core/auth/server";
import { hashPassword } from "better-auth/crypto";
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
  pharmacist: { ar: "صيدلي", en: "Pharmacist" },
  cashier: { ar: "كاشير", en: "Cashier" },
  accountant: { ar: "محاسب", en: "Accountant" },
  procurement: { ar: "مسؤول مشتريات", en: "Procurement Officer" },
  inventory: { ar: "مدير مخزون", en: "Inventory Manager" },
  insurance: { ar: "موظف تأمين", en: "Insurance Officer" },
  auditor: { ar: "مدقق", en: "Auditor" },
};

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

  for (const key of ["PATIENT", "ENCOUNTER", "INVOICE", "RECEIPT", "QUEUE"]) {
    await prisma.numberSequence.upsert({
      where: { clinicId_key: { clinicId: clinic.id, key } },
      create: { clinicId: clinic.id, key, prefix: key === "PATIENT" ? "P" : "", currentValue: 0n, padLength: 5 },
      update: {},
    });
  }

  console.log("Seeding admin user...");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@clinic.local";
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin";
  const superAdminRoleId = roleIds.get("super_admin");
  if (!superAdminRoleId) throw new Error("super_admin role missing");

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
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
    console.log(`Admin created: ${adminUsername} / ${adminEmail}`);
  } else {
    const hashedPassword = await hashPassword(adminPassword);
    await prisma.user.update({
      where: { id: existing.id },
      data: { username: adminUsername, displayUsername: adminUsername },
    });
    await prisma.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password: hashedPassword },
    });
    console.log(`Admin updated: ${adminUsername} / ${adminEmail}`);
  }

  console.log("Seeding medication catalog...");
  const MEDICATIONS = [
    { code: "MED-PARA", generic: "Paracetamol", brand: "Panadol", strength: "500", unit: "mg", form: "TABLET", route: "ORAL", category: "Analgesic" },
    { code: "MED-IBU", generic: "Ibuprofen", brand: "Brufen", strength: "400", unit: "mg", form: "TABLET", route: "ORAL", category: "NSAID" },
    { code: "MED-ASP", generic: "Aspirin", brand: null, strength: "81", unit: "mg", form: "TABLET", route: "ORAL", category: "Antiplatelet" },
    { code: "MED-AMOX", generic: "Amoxicillin", brand: "Amoxil", strength: "500", unit: "mg", form: "CAPSULE", route: "ORAL", category: "Antibiotic" },
    { code: "MED-AUG", generic: "Amoxicillin/Clavulanate", brand: "Augmentin", strength: "625", unit: "mg", form: "TABLET", route: "ORAL", category: "Antibiotic" },
    { code: "MED-AZI", generic: "Azithromycin", brand: "Zithromax", strength: "500", unit: "mg", form: "TABLET", route: "ORAL", category: "Antibiotic" },
    { code: "MED-CIPRO", generic: "Ciprofloxacin", brand: "Ciprobay", strength: "500", unit: "mg", form: "TABLET", route: "ORAL", category: "Antibiotic" },
    { code: "MED-OMEP", generic: "Omeprazole", brand: "Losec", strength: "20", unit: "mg", form: "CAPSULE", route: "ORAL", category: "PPI" },
    { code: "MED-MET", generic: "Metformin", brand: "Glucophage", strength: "500", unit: "mg", form: "TABLET", route: "ORAL", category: "Antidiabetic" },
    { code: "MED-ENA", generic: "Enalapril", brand: "Renitec", strength: "10", unit: "mg", form: "TABLET", route: "ORAL", category: "ACE inhibitor" },
    { code: "MED-AMLO", generic: "Amlodipine", brand: "Norvasc", strength: "5", unit: "mg", form: "TABLET", route: "ORAL", category: "Antihypertensive" },
    { code: "MED-ATOR", generic: "Atorvastatin", brand: "Lipitor", strength: "20", unit: "mg", form: "TABLET", route: "ORAL", category: "Statin" },
    { code: "MED-WARF", generic: "Warfarin", brand: "Coumadin", strength: "5", unit: "mg", form: "TABLET", route: "ORAL", category: "Anticoagulant" },
    { code: "MED-SALB", generic: "Salbutamol", brand: "Ventolin", strength: "100", unit: "mcg", form: "INHALER", route: "INHALATION", category: "Bronchodilator" },
    { code: "MED-PRED", generic: "Prednisolone", brand: null, strength: "5", unit: "mg", form: "TABLET", route: "ORAL", category: "Corticosteroid" },
    { code: "MED-INS", generic: "Insulin", brand: null, strength: "100", unit: "IU/mL", form: "INJECTION", route: "SUBCUTANEOUS", category: "Antidiabetic" },
  ] as const;

  for (const m of MEDICATIONS) {
    await prisma.medication.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: m.code } },
      create: {
        clinicId: clinic.id,
        code: m.code,
        genericName: m.generic,
        brandName: m.brand,
        strength: m.strength,
        strengthUnit: m.unit,
        form: m.form,
        route: m.route,
        category: m.category,
        isActive: true,
      },
      update: {
        genericName: m.generic,
        brandName: m.brand,
        strength: m.strength,
        strengthUnit: m.unit,
        form: m.form,
        route: m.route,
        category: m.category,
      },
    });
  }

  console.log("Seeding medication interactions...");
  const interactionCount = await prisma.medicationInteraction.count({
    where: { clinicId: clinic.id },
  });
  if (interactionCount === 0) {
    const INTERACTIONS = [
      { a: "Warfarin", b: "Aspirin", severity: "MAJOR", d: "Increased bleeding risk." },
      { a: "Warfarin", b: "Ibuprofen", severity: "MAJOR", d: "NSAIDs increase bleeding risk with anticoagulants." },
      { a: "Aspirin", b: "Ibuprofen", severity: "MODERATE", d: "Ibuprofen may reduce the antiplatelet effect of aspirin." },
      { a: "Enalapril", b: "Ibuprofen", severity: "MODERATE", d: "NSAIDs may reduce ACE-inhibitor effect and impair renal function." },
      { a: "Enalapril", b: "Metformin", severity: "MINOR", d: "Monitor renal function and glycemic control." },
      { a: "Ciprofloxacin", b: "Warfarin", severity: "MAJOR", d: "Ciprofloxacin potentiates warfarin; monitor INR." },
      { a: "Prednisolone", b: "Ibuprofen", severity: "MODERATE", d: "Additive risk of gastrointestinal ulceration." },
    ] as const;
    await prisma.medicationInteraction.createMany({
      data: INTERACTIONS.map((i) => ({
        clinicId: clinic.id,
        drugA: i.a,
        drugB: i.b,
        severity: i.severity,
        description: i.d,
      })),
    });
  }

  console.log("Seeding laboratory categories & tests...");
  const LAB_CATEGORIES = [
    { code: "HEMATOLOGY", nameAr: "أمراض الدم", nameEn: "Hematology" },
    { code: "BIOCHEMISTRY", nameAr: "الكيمياء الحيوية", nameEn: "Biochemistry" },
    { code: "LIPID", nameAr: "الدهون", nameEn: "Lipid profile" },
    { code: "ENDOCRINE", nameAr: "الغدد الصماء", nameEn: "Endocrinology" },
    { code: "URINALYSIS", nameAr: "تحليل البول", nameEn: "Urinalysis" },
    { code: "MICROBIOLOGY", nameAr: "الأحياء الدقيقة", nameEn: "Microbiology" },
    { code: "SEROLOGY", nameAr: "المصليات", nameEn: "Serology" },
    { code: "COAGULATION", nameAr: "التخثر", nameEn: "Coagulation" },
    { code: "HORMONES", nameAr: "الهرمونات", nameEn: "Hormones" },
    { code: "OTHER", nameAr: "تحليلات أخرى", nameEn: "Other" },
  ] as const;

  const catId: Record<string, string> = {};
  let sort = 0;
  for (const c of LAB_CATEGORIES) {
    const cat = await prisma.labTestCategory.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: c.code } },
      create: { clinicId: clinic.id, code: c.code, nameAr: c.nameAr, nameEn: c.nameEn, sortOrder: sort },
      update: { nameAr: c.nameAr, nameEn: c.nameEn, sortOrder: sort },
      select: { id: true },
    });
    catId[c.code] = cat.id;
    sort++;
  }

  type Range = {
    sex?: "ANY" | "MALE" | "FEMALE";
    low?: number;
    high?: number;
    criticalLow?: number;
    criticalHigh?: number;
    text?: string;
  };
  const LAB_TESTS: {
    code: string;
    nameAr: string;
    nameEn: string;
    cat: string;
    unit?: string;
    method?: string;
    specimen: string;
    price: number;
    tat?: number;
    collect?: string;
    ranges?: Range[];
  }[] = [
    { code: "CBC", nameAr: "صورة الدم الكاملة", nameEn: "Complete Blood Count", cat: "HEMATOLOGY", unit: "x10^9/L", method: "Automated", specimen: "BLOOD", price: 3000, tat: 4, ranges: [{ text: "See individual indices" }] },
    { code: "HGB", nameAr: "الهيموغلوبين", nameEn: "Hemoglobin", cat: "HEMATOLOGY", unit: "g/dL", specimen: "BLOOD", price: 1500, tat: 4, ranges: [{ sex: "MALE", low: 13, high: 17, criticalLow: 7, criticalHigh: 20 }, { sex: "FEMALE", low: 12, high: 15, criticalLow: 7, criticalHigh: 20 }] },
    { code: "WBC", nameAr: "عدد الكريات البيضاء", nameEn: "White Blood Cells", cat: "HEMATOLOGY", unit: "x10^9/L", specimen: "BLOOD", price: 1500, tat: 4, ranges: [{ low: 4, high: 11, criticalLow: 1, criticalHigh: 30 }] },
    { code: "PLT", nameAr: "الصفائح الدموية", nameEn: "Platelets", cat: "HEMATOLOGY", unit: "x10^9/L", specimen: "BLOOD", price: 1500, tat: 4, ranges: [{ low: 150, high: 400, criticalLow: 20, criticalHigh: 1000 }] },
    { code: "GLU", nameAr: "سكر الدم صائم", nameEn: "Fasting Blood Glucose", cat: "BIOCHEMISTRY", unit: "mg/dL", specimen: "SERUM", price: 1000, tat: 3, collect: "8-hour fast", ranges: [{ low: 70, high: 100, criticalLow: 40, criticalHigh: 500 }] },
    { code: "HBA1C", nameAr: "الهيموغلوبين السكري", nameEn: "HbA1c", cat: "BIOCHEMISTRY", unit: "%", method: "HPLC", specimen: "BLOOD", price: 4500, tat: 24, ranges: [{ low: 4, high: 5.6 }] },
    { code: "CREA", nameAr: "الكرياتينين", nameEn: "Creatinine", cat: "BIOCHEMISTRY", unit: "mg/dL", specimen: "SERUM", price: 1500, tat: 4, ranges: [{ sex: "MALE", low: 0.7, high: 1.3, criticalHigh: 5 }, { sex: "FEMALE", low: 0.6, high: 1.1, criticalHigh: 5 }] },
    { code: "ALT", nameAr: "إنزيم الكبد ALT", nameEn: "Alanine Aminotransferase", cat: "BIOCHEMISTRY", unit: "U/L", specimen: "SERUM", price: 1500, tat: 6, ranges: [{ low: 7, high: 56 }] },
    { code: "AST", nameAr: "إنزيم الكبد AST", nameEn: "Aspartate Aminotransferase", cat: "BIOCHEMISTRY", unit: "U/L", specimen: "SERUM", price: 1500, tat: 6, ranges: [{ low: 10, high: 40 }] },
    { code: "CHOL", nameAr: "الكوليسترول الكلي", nameEn: "Total Cholesterol", cat: "LIPID", unit: "mg/dL", specimen: "SERUM", price: 2000, tat: 6, collect: "12-hour fast", ranges: [{ high: 200 }] },
    { code: "TG", nameAr: "الدهون الثلاثية", nameEn: "Triglycerides", cat: "LIPID", unit: "mg/dL", specimen: "SERUM", price: 2000, tat: 6, collect: "12-hour fast", ranges: [{ high: 150 }] },
    { code: "TSH", nameAr: "هرمون الغدة الدرقية", nameEn: "Thyroid Stimulating Hormone", cat: "ENDOCRINE", unit: "mIU/L", specimen: "SERUM", price: 4000, tat: 24, ranges: [{ low: 0.4, high: 4 }] },
    { code: "UA", nameAr: "تحليل البول", nameEn: "Urinalysis", cat: "URINALYSIS", unit: "", specimen: "URINE", price: 1200, tat: 3, collect: "Midstream clean catch", ranges: [{ text: "Negative for protein, glucose, blood, nitrite" }] },
    { code: "STOOL", nameAr: "تحليل البراز", nameEn: "Stool Analysis", cat: "MICROBIOLOGY", specimen: "STOOL", price: 1500, tat: 6, ranges: [{ text: "No ova, cysts or parasites" }] },
    { code: "CULTURE", nameAr: "مزرعة ومزرعة الحساسية", nameEn: "Culture & Sensitivity", cat: "MICROBIOLOGY", specimen: "SWAB", price: 6000, tat: 72, ranges: [{ text: "Report growth and sensitivities" }] },
    { code: "WIDAL", nameAr: "تحليل فيدال", nameEn: "Widal Test", cat: "SEROLOGY", unit: "titer", specimen: "SERUM", price: 2500, tat: 24, ranges: [{ text: "Negative < 1:80" }] },
    { code: "PT-INR", nameAr: "زمن البروثرومبين INR", nameEn: "Prothrombin Time / INR", cat: "COAGULATION", unit: "INR", specimen: "PLASMA", price: 3000, tat: 6, ranges: [{ low: 0.8, high: 1.2, criticalHigh: 5 }] },
  ];

  for (const lst of LAB_TESTS) {
    const test = await prisma.labTest.upsert({
      where: { clinicId_code: { clinicId: clinic.id, code: lst.code } },
      create: {
        clinicId: clinic.id,
        code: lst.code,
        nameAr: lst.nameAr,
        nameEn: lst.nameEn,
        category: lst.cat,
        categoryId: catId[lst.cat] ?? null,
        unit: lst.unit ?? null,
        method: lst.method ?? null,
        specimenType: lst.specimen as never,
        collectionInstructions: lst.collect ?? null,
        turnaroundHours: lst.tat ?? null,
        price: lst.price,
      },
      update: {
        nameAr: lst.nameAr,
        nameEn: lst.nameEn,
        category: lst.cat,
        categoryId: catId[lst.cat] ?? null,
        unit: lst.unit ?? null,
        method: lst.method ?? null,
        specimenType: lst.specimen as never,
        collectionInstructions: lst.collect ?? null,
        turnaroundHours: lst.tat ?? null,
        price: lst.price,
      },
      select: { id: true },
    });
    await prisma.labReferenceRange.deleteMany({ where: { testId: test.id } });
    if (lst.ranges?.length) {
      await prisma.labReferenceRange.createMany({
        data: lst.ranges.map((r) => ({
          testId: test.id,
          sex: (r.sex ?? "ANY") as never,
          low: r.low ?? null,
          high: r.high ?? null,
          criticalLow: r.criticalLow ?? null,
          criticalHigh: r.criticalHigh ?? null,
          unit: lst.unit ?? null,
          text: r.text ?? null,
        })),
      });
    }
  }

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
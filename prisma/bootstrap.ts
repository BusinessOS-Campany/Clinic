// Per-organization bootstrap: the reference rows a fresh org database needs
// that the migrations deliberately do not carry — the roles and permissions the
// app authorises against, plus the one clinic and its number sequences.
//
// This is deliberately NOT `prisma/seed.ts`. The seed is a development fixture:
// it creates an admin on a published password and fills the clinic with
// fictional patients, medications and lab tests. Running that inside a
// customer's own database would hand every org the same login and a pile of
// sample data. This file instead tops up a real org's database, and is safe to
// run on every start.
//
// Run: npx tsx prisma/bootstrap.ts
import "dotenv/config";
import { PrismaClient } from "../src/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PERMISSION_CATALOG,
  ROLE_CODES,
  ROLE_PERMISSIONS,
  type RoleCode,
} from "../src/core/rbac/catalog";

// Same connection the runtime uses: the org's own database. The schema is
// explicit because the pg driver adapter always defaults to `public`, while
// migrate reads it from ?schema= in the URL.
const schema =
  process.env.DATABASE_SCHEMA ??
  new URL(process.env.DATABASE_URL ?? "").searchParams.get("schema") ??
  undefined;
const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL },
  { schema },
);
const prisma = new PrismaClient({ adapter });

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

async function main() {
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

  const permissions = await prisma.permission.findMany({ select: { id: true, code: true } });
  const permissionIdByCode = new Map(permissions.map((p) => [p.code, p.id]));

  const roleIdByCode = new Map<string, string>();
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
      select: { id: true },
    });
    roleIdByCode.set(code, role.id);
  }

  let grantsFilled = 0;
  for (const code of ROLE_CODES) {
    const roleId = roleIdByCode.get(code);
    if (!roleId) continue;
    // Filling an EMPTY grant list only is what keeps this additive: an org that
    // has trimmed a role's permissions on purpose keeps its own version.
    const count = await prisma.rolePermission.count({ where: { roleId } });
    if (count > 0) continue;
    const data = ROLE_PERMISSIONS[code]
      .map((perm) => {
        const permissionId = permissionIdByCode.get(perm);
        return permissionId ? { roleId, permissionId } : null;
      })
      .filter((x): x is { roleId: string; permissionId: string } => x !== null);
    if (data.length) {
      await prisma.rolePermission.createMany({ data });
      grantsFilled++;
    }
  }

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
    select: { id: true },
  });

  for (const key of ["PATIENT", "ENCOUNTER", "INVOICE", "RECEIPT", "QUEUE"]) {
    await prisma.numberSequence.upsert({
      where: { clinicId_key: { clinicId: clinic.id, key } },
      create: {
        clinicId: clinic.id,
        key,
        prefix: key === "PATIENT" ? "P" : "",
        currentValue: 0n,
        padLength: 5,
      },
      update: {},
    });
  }

  console.log(
    `[bootstrap] roles=${ROLE_CODES.length} permissions=${PERMISSION_CATALOG.length} ` +
      `grantsFilled=${grantsFilled} clinic=${clinic.id} ok`,
  );
}

main()
  .catch((err) => {
    console.error("[bootstrap] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/**
 * Central RBAC catalogue: permissions and role -> permission mapping.
 * Enforcement happens server-side (see core/rbac/index.ts).
 * Seed data mirrors this catalogue (prisma/seed.ts).
 */

export const MODULES = [
  "patients",
  "diagnoses",
  "appointments",
  "scheduling",
  "reception",
  "queue",
  "encounters",
  "nursing",
  "laboratory",
  "pharmacy",
  "imaging",
  "inventory",
  "billing",
  "financial",
  "reports",
  "insurance",
  "procurement",
  "accounting",
  "staff",
  "audit",
  "settings",
  "users",
] as const;

export const ACTIONS = ["read", "write", "sign", "order", "result", "verify", "dispense", "prescribe", "refund", "discount", "post", "manage", "report", "merge"] as const;

export type Module = (typeof MODULES)[number];
export type Action = (typeof ACTIONS)[number];

export type PermissionSpec = {
  code: string;
  module: Module;
  action: Action;
  descriptionAr: string;
  descriptionEn: string;
};

export const PERMISSION_CATALOG: PermissionSpec[] = [
  // patients
  h("patients", "read", "عرض سجلات المرضى", "View patient records"),
  h("patients", "write", "إنشاء وتعديل سجلات المرضى", "Create/update patient records"),
  h("patients", "merge", "دمج سجلات المرضى المكررة", "Merge duplicate patient records"),
  // diagnoses
  h("diagnoses", "read", "عرض التشخيصات", "View diagnoses"),
  h("diagnoses", "write", "تسجيل وتعديل التشخيصات", "Record/update diagnoses"),
  h("diagnoses", "manage", "إدارة كتالوج التشخيصات", "Manage diagnosis catalog"),
  // appointments
  h("appointments", "read", "عرض المواعيد", "View appointments"),
  h("appointments", "write", "إدارة المواعيد", "Manage appointments"),
  // scheduling
  h("scheduling", "read", "عرض جداول الأطباء والتوفر", "View doctor schedules & availability"),
  h("scheduling", "write", "إدارة جداول الأطباء والإجازات", "Manage doctor schedules & time off"),
  // reception
  h("reception", "read", "عرض شاشة الاستقبال", "View reception workspace"),
  h("reception", "write", "تسجيل الوصول والمغادرة", "Check-in/check-out"),
  // queue
  h("queue", "read", "عرض الطابور", "View queue board"),
  h("queue", "write", "إدارة الطابور", "Manage queue"),
  // encounters
  h("encounters", "read", "عرض الجلسات والملاحظات", "View encounters and notes"),
  h("encounters", "write", "كتابة وتعديل الملاحظات", "Write/edit notes"),
  h("encounters", "sign", "التوقيع على الملاحظات", "Sign clinical notes"),
  // nursing
  h("nursing", "read", "عرض شاشة التمريض والفرز", "View nursing & triage"),
  h("nursing", "write", "تسجيل العلامات الحيوية والفرز", "Record vitals & triage"),
  // laboratory
  h("laboratory", "read", "عرض طلبات المختبر", "View laboratory orders"),
  h("laboratory", "order", "إنشاء طلبات مخبرية", "Create laboratory orders"),
  h("laboratory", "result", "إدخال النتائج", "Enter laboratory results"),
  h("laboratory", "verify", "اعتماد النتائج", "Verify laboratory results"),
  // pharmacy
  h("pharmacy", "read", "عرض الصيدلية", "View pharmacy"),
  h("pharmacy", "prescribe", "كتابة وصفات طبية", "Write prescriptions"),
  h("pharmacy", "dispense", "صرف الأدوية", "Dispense medications"),
  h("pharmacy", "manage", "إدارة كتالوج الأدوية والتفاعلات", "Manage medication catalog & interactions"),
  // imaging
  h("imaging", "read", "عرض طلبات التصوير", "View imaging requests"),
  h("imaging", "write", "تنفيذ وتعديل التصوير", "Perform imaging"),
  h("imaging", "report", "كتابة تقارير التصوير", "Write imaging reports"),
  // inventory
  h("inventory", "read", "عرض المخزون", "View inventory"),
  h("inventory", "write", "إدارة المخزون", "Manage inventory"),
  // billing
  h("billing", "read", "عرض الفواتير", "View invoices"),
  h("billing", "write", "إنشاء الفواتير", "Create invoices"),
  h("billing", "discount", "منح الخصومات", "Apply discounts"),
  h("billing", "refund", "معالجة الاسترداد", "Process refunds"),
  // financial
  h("financial", "read", "عرض البيانات المالية", "View financial data"),
  h("financial", "post", "ترحيل القيود المالية", "Post financial entries"),
  // reports
  h("reports", "read", "عرض التقارير", "View reports"),
  // insurance
  h("insurance", "read", "عرض التأمينات", "View insurance"),
  h("insurance", "write", "إدارة التأمينات والمطالبات", "Manage insurance & claims"),
  // procurement
  h("procurement", "read", "عرض المشتريات", "View procurement"),
  h("procurement", "write", "إدارة المشتريات", "Manage procurement"),
  // accounting
  h("accounting", "read", "عرض الحسابات", "View accounting"),
  h("accounting", "write", "إدارة الحسابات", "Manage accounting"),
  // staff
  h("staff", "read", "عرض بيانات الموظفين", "View staff"),
  h("staff", "write", "إدارة الموظفين", "Manage staff"),
  // audit
  h("audit", "read", "عرض سجل التدقيق", "View audit log"),
  // settings
  h("settings", "read", "عرض الإعدادات", "View settings"),
  h("settings", "write", "تعديل الإعدادات", "Edit settings"),
  // users
  h("users", "manage", "إدارة المستخدمين والأدوار", "Manage users & roles"),
];

function h(module: Module, action: Action, descriptionAr: string, descriptionEn: string): PermissionSpec {
  return { code: `${module}:${action}`, module, action, descriptionAr, descriptionEn };
}

export type PermissionCode = (typeof PERMISSION_CATALOG)[number]["code"];

export const ROLE_CODES = [
  "super_admin",
  "manager",
  "receptionist",
  "physician",
  "nurse",
  "lab_tech",
  "lab_reviewer",
  "pharmacist",
  "cashier",
  "accountant",
  "procurement",
  "inventory",
  "insurance",
  "auditor",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/** Grant list per role (expanded at seed time against PERMISSION_CATALOG). */
export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  super_admin: PERMISSION_CATALOG.map((p) => p.code as PermissionCode),
  manager: [
    "patients:read", "patients:write", "patients:merge",
    "diagnoses:read", "diagnoses:write", "diagnoses:manage",
    "appointments:read", "appointments:write",
    "scheduling:read", "scheduling:write",
    "reception:read", "reception:write",
    "queue:read", "queue:write",
    "encounters:read", "encounters:write", "encounters:sign",
    "nursing:read", "nursing:write",
    "laboratory:read", "laboratory:order", "laboratory:verify",
    "pharmacy:read", "pharmacy:prescribe", "pharmacy:dispense", "pharmacy:manage",
    "imaging:read", "imaging:write", "imaging:report",
    "inventory:read", "inventory:write",
    "billing:read", "billing:write", "billing:discount", "billing:refund",
    "financial:read",
    "reports:read",
    "insurance:read", "insurance:write",
    "procurement:read", "procurement:write",
    "accounting:read", "accounting:write",
    "staff:read", "staff:write",
    "settings:read",
  ],
  receptionist: [
    "patients:read", "patients:write",
    "diagnoses:read",
    "appointments:read", "appointments:write",
    "scheduling:read", "scheduling:write",
    "reception:read", "reception:write",
    "queue:read", "queue:write",
    "nursing:read",
    "billing:read",
  ],
  physician: [
    "patients:read",
    "diagnoses:read", "diagnoses:write",
    "appointments:read",
    "scheduling:read",
    "reception:read",
    "queue:read",
    "encounters:read", "encounters:write", "encounters:sign",
    "nursing:read",
    "laboratory:read", "laboratory:order",
    "pharmacy:read", "pharmacy:prescribe",
    "imaging:read",
  ],
  nurse: [
    "patients:read",
    "diagnoses:read",
    "appointments:read",
    "scheduling:read",
    "reception:read",
    "queue:read", "queue:write",
    "encounters:read", "encounters:write",
    "nursing:read", "nursing:write",
    "imaging:read",
  ],
  lab_tech: ["patients:read", "laboratory:read", "laboratory:order", "laboratory:result"],
  lab_reviewer: ["patients:read", "laboratory:read", "laboratory:order", "laboratory:result", "laboratory:verify"],
  pharmacist: ["pharmacy:read", "pharmacy:dispense", "pharmacy:manage", "inventory:read"],
  cashier: ["patients:read", "billing:read", "billing:write"],
  accountant: ["billing:read", "financial:read", "financial:post", "accounting:read", "accounting:write", "reports:read"],
  procurement: ["procurement:read", "procurement:write", "inventory:read"],
  inventory: ["inventory:read", "inventory:write", "pharmacy:read"],
  insurance: ["insurance:read", "insurance:write", "billing:read"],
  auditor: ["audit:read", "reports:read", "financial:read", "diagnoses:read"],
};
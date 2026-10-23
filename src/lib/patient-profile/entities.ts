import { z } from "zod";
import type { ProfileTabId } from "./tabs";

export type FieldKind =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "select"
  | "switch";

export type RecordField = {
  name: string;
  labelKey: string;
  kind: FieldKind;
  required?: boolean;
  placeholderKey?: string;
  options?: readonly { value: string; labelKey: string }[];
  span?: 1 | 2;
  ltr?: boolean;
};

export type RecordValues = Record<string, string | number | boolean | undefined>;

export type ProfileEntity =
  | "history"
  | "allergies"
  | "procedures"
  | "documents"
  | "referrals";

export type ProfileActionError =
  | "no-clinic"
  | "not-found"
  | "invalid"
  | "unknown-entity";

export type ProfileActionResult =
  | { ok: true; id: string }
  | { ok: false; error: ProfileActionError };

export type WriteContext = {
  clinicId: string;
  patientId: string;
  actorId: string;
};

export type WriteMode = "create" | "update";

export type EntityConfig = {
  entity: ProfileEntity;
  tab: ProfileTabId;
  entityName: string;
  singularKey: string;
  fields: readonly RecordField[];
  schema: z.ZodTypeAny;
  toData: (
    values: RecordValues,
    ctx: WriteContext,
    mode: WriteMode,
  ) => Record<string, unknown>;
};

const optionalText = z.string().trim().optional();
const optionalDate = z.string().optional();

function dateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function bool(value: unknown): boolean {
  return value === true || value === "true" || value === "on";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const historyEntrySchema = z.object({
  type: z.enum(["MEDICAL", "SURGICAL", "OBSTETRIC", "FAMILY", "SOCIAL", "IMMUNIZATION"]),
  title: z.string().trim().min(1, "required"),
  description: optionalText,
  occurredAt: optionalDate,
});

export const allergySchema = z.object({
  allergen: z.string().trim().min(1, "required"),
  type: z.enum(["DRUG", "FOOD", "ENVIRONMENT", "OTHER"]),
  reaction: optionalText,
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
  notedAt: optionalDate,
  isActive: z.boolean(),
});

export const procedureSchema = z.object({
  name: z.string().trim().min(1, "required"),
  code: optionalText,
  category: optionalText,
  performedAt: optionalDate,
  provider: optionalText,
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: optionalText,
});

export const documentSchema = z.object({
  fileName: z.string().trim().min(1, "required"),
  category: z.enum([
    "IDENTITY",
    "MEDICAL_REPORT",
    "IMAGING",
    "LABORATORY",
    "CONSENT",
    "INVOICE",
    "OTHER",
  ]),
  mimeType: optionalText,
  notes: optionalText,
});

export const referralSchema = z.object({
  type: z.enum(["INTERNAL", "EXTERNAL"]),
  toFacility: optionalText,
  toDepartment: optionalText,
  toDoctor: optionalText,
  reason: z.string().trim().min(1, "required"),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"]),
  notes: optionalText,
});

export const RECORD_CONFIGS: Record<ProfileEntity, EntityConfig> = {
  history: {
    entity: "history",
    tab: "history",
    entityName: "MedicalHistory",
    singularKey: "historyEntry",
    fields: [
      {
        name: "type",
        labelKey: "type",
        kind: "select",
        required: true,
        options: [
          { value: "MEDICAL", labelKey: "historyType_MEDICAL" },
          { value: "SURGICAL", labelKey: "historyType_SURGICAL" },
          { value: "OBSTETRIC", labelKey: "historyType_OBSTETRIC" },
          { value: "FAMILY", labelKey: "historyType_FAMILY" },
          { value: "SOCIAL", labelKey: "historyType_SOCIAL" },
          { value: "IMMUNIZATION", labelKey: "historyType_IMMUNIZATION" },
        ],
      },
      { name: "title", labelKey: "title", kind: "text", required: true, span: 2 },
      {
        name: "occurredAt",
        labelKey: "occurredAt",
        kind: "date",
      },
      { name: "description", labelKey: "description", kind: "textarea", span: 2 },
    ],
    schema: historyEntrySchema,
    toData: (values, ctx) => ({
      clinicId: ctx.clinicId,
      patientId: ctx.patientId,
      type: values.type as string,
      title: String(values.title ?? ""),
      description: text(values.description),
      occurredAt: dateOrNull(values.occurredAt),
      recordedBy: ctx.actorId,
    }),
  },

  allergies: {
    entity: "allergies",
    tab: "allergies",
    entityName: "Allergy",
    singularKey: "allergy",
    fields: [
      { name: "allergen", labelKey: "allergen", kind: "text", required: true, ltr: true },
      {
        name: "type",
        labelKey: "type",
        kind: "select",
        required: true,
        options: [
          { value: "DRUG", labelKey: "allergyType_DRUG" },
          { value: "FOOD", labelKey: "allergyType_FOOD" },
          { value: "ENVIRONMENT", labelKey: "allergyType_ENVIRONMENT" },
          { value: "OTHER", labelKey: "allergyType_OTHER" },
        ],
      },
      {
        name: "severity",
        labelKey: "severity",
        kind: "select",
        required: true,
        options: [
          { value: "MILD", labelKey: "severity_MILD" },
          { value: "MODERATE", labelKey: "severity_MODERATE" },
          { value: "SEVERE", labelKey: "severity_SEVERE" },
        ],
      },
      { name: "notedAt", labelKey: "notedAt", kind: "date" },
      { name: "reaction", labelKey: "reaction", kind: "text", span: 2 },
      { name: "isActive", labelKey: "isActive", kind: "switch", span: 2 },
    ],
    schema: allergySchema,
    toData: (values, ctx) => ({
      clinicId: ctx.clinicId,
      patientId: ctx.patientId,
      allergen: String(values.allergen ?? ""),
      type: values.type as string,
      reaction: text(values.reaction),
      severity: values.severity as string,
      isActive: bool(values.isActive),
      notedAt: dateOrNull(values.notedAt),
      recordedBy: ctx.actorId,
    }),
  },

  procedures: {
    entity: "procedures",
    tab: "procedures",
    entityName: "Procedure",
    singularKey: "procedure",
    fields: [
      { name: "name", labelKey: "procedureName", kind: "text", required: true, span: 2 },
      { name: "code", labelKey: "code", kind: "text", ltr: true },
      { name: "category", labelKey: "category", kind: "text" },
      { name: "performedAt", labelKey: "performedAt", kind: "date" },
      { name: "provider", labelKey: "provider", kind: "text" },
      {
        name: "status",
        labelKey: "status",
        kind: "select",
        required: true,
        options: [
          { value: "PLANNED", labelKey: "procedureStatus_PLANNED" },
          { value: "IN_PROGRESS", labelKey: "procedureStatus_IN_PROGRESS" },
          { value: "COMPLETED", labelKey: "procedureStatus_COMPLETED" },
          { value: "CANCELLED", labelKey: "procedureStatus_CANCELLED" },
        ],
      },
      { name: "notes", labelKey: "notes", kind: "textarea", span: 2 },
    ],
    schema: procedureSchema,
    toData: (values, ctx) => ({
      clinicId: ctx.clinicId,
      patientId: ctx.patientId,
      name: String(values.name ?? ""),
      code: text(values.code),
      category: text(values.category),
      performedAt: dateOrNull(values.performedAt),
      provider: text(values.provider),
      status: values.status as string,
      notes: text(values.notes),
      createdBy: ctx.actorId,
    }),
  },

  documents: {
    entity: "documents",
    tab: "documents",
    entityName: "PatientDocument",
    singularKey: "document",
    fields: [
      { name: "fileName", labelKey: "fileName", kind: "text", required: true, span: 2, ltr: true },
      {
        name: "category",
        labelKey: "category",
        kind: "select",
        required: true,
        options: [
          { value: "IDENTITY", labelKey: "documentCategory_IDENTITY" },
          { value: "MEDICAL_REPORT", labelKey: "documentCategory_MEDICAL_REPORT" },
          { value: "IMAGING", labelKey: "documentCategory_IMAGING" },
          { value: "LABORATORY", labelKey: "documentCategory_LABORATORY" },
          { value: "CONSENT", labelKey: "documentCategory_CONSENT" },
          { value: "INVOICE", labelKey: "documentCategory_INVOICE" },
          { value: "OTHER", labelKey: "documentCategory_OTHER" },
        ],
      },
      { name: "mimeType", labelKey: "mimeType", kind: "text", ltr: true },
      { name: "notes", labelKey: "notes", kind: "textarea", span: 2 },
    ],
    schema: documentSchema,
    toData: (values, ctx, mode) => {
      const fileName = String(values.fileName ?? "").trim();
      const safe = slug(fileName) || "document";
      const stamp = new Date().toISOString().slice(0, 10);
      return {
        clinicId: ctx.clinicId,
        patientId: ctx.patientId,
        fileName,
        ...(mode === "create"
          ? { storageKey: `patients/${ctx.patientId}/${stamp}-${safe}` }
          : {}),
        category: values.category as string,
        mimeType: text(values.mimeType),
        notes: text(values.notes),
        uploadedBy: ctx.actorId,
      };
    },
  },

  referrals: {
    entity: "referrals",
    tab: "referrals",
    entityName: "Referral",
    singularKey: "referral",
    fields: [
      {
        name: "type",
        labelKey: "type",
        kind: "select",
        required: true,
        options: [
          { value: "INTERNAL", labelKey: "referralType_INTERNAL" },
          { value: "EXTERNAL", labelKey: "referralType_EXTERNAL" },
        ],
      },
      {
        name: "status",
        labelKey: "status",
        kind: "select",
        required: true,
        options: [
          { value: "PENDING", labelKey: "referralStatus_PENDING" },
          { value: "ACCEPTED", labelKey: "referralStatus_ACCEPTED" },
          { value: "REJECTED", labelKey: "referralStatus_REJECTED" },
          { value: "COMPLETED", labelKey: "referralStatus_COMPLETED" },
          { value: "CANCELLED", labelKey: "referralStatus_CANCELLED" },
        ],
      },
      { name: "toFacility", labelKey: "toFacility", kind: "text", span: 2 },
      { name: "toDepartment", labelKey: "toDepartment", kind: "text" },
      { name: "toDoctor", labelKey: "toDoctor", kind: "text" },
      { name: "reason", labelKey: "reason", kind: "textarea", span: 2 },
      { name: "notes", labelKey: "notes", kind: "textarea", span: 2 },
    ],
    schema: referralSchema,
    toData: (values, ctx) => ({
      clinicId: ctx.clinicId,
      patientId: ctx.patientId,
      type: values.type as string,
      status: values.status as string,
      toFacility: text(values.toFacility),
      toDepartment: text(values.toDepartment),
      toDoctor: text(values.toDoctor),
      reason: text(values.reason),
      notes: text(values.notes),
      requestedBy: ctx.actorId,
      respondedAt:
        values.status === "PENDING" ? null : new Date(),
    }),
  },
};

export function isProfileEntity(value: unknown): value is ProfileEntity {
  return typeof value === "string" && value in RECORD_CONFIGS;
}

export function entityConfig(entity: ProfileEntity): EntityConfig {
  return RECORD_CONFIGS[entity];
}

export function defaultValuesFor(config: EntityConfig): RecordValues {
  const out: RecordValues = {};
  for (const field of config.fields) {
    if (field.kind === "switch") out[field.name] = true;
    else if (field.kind === "select" && field.options?.[0]) {
      out[field.name] = field.options[0].value;
    } else out[field.name] = "";
  }
  return out;
}
import { prisma } from "@/lib/db";

export const SETTING_KEYS = [
  "clinic.currency",
  "clinic.timezone",
  "clinic.locale",
  "clinic.dateFormat",
] as const;

export type ClinicSettings = {
  currency: string;
  timezone: string;
  locale: "ar" | "en";
  dateFormat: string;
};

const DEFAULTS: ClinicSettings = {
  currency: "YER",
  timezone: "Asia/Aden",
  locale: "ar",
  dateFormat: "dd/MM/yyyy",
};

export async function getSettings(): Promise<ClinicSettings> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });
  const map = new Map<string, string>();
  for (const row of rows) {
    const v = row.value;
    if (
      v !== null &&
      (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    ) {
      map.set(row.key, String(v));
    }
  }
  return {
    currency: map.get("clinic.currency") ?? DEFAULTS.currency,
    timezone: map.get("clinic.timezone") ?? DEFAULTS.timezone,
    locale: (map.get("clinic.locale") as ClinicSettings["locale"]) ?? DEFAULTS.locale,
    dateFormat: map.get("clinic.dateFormat") ?? DEFAULTS.dateFormat,
  };
}

export async function upsertSetting(key: string, value: string, updatedBy?: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value,
      type: "string",
      descriptionEn: key,
      updatedBy,
    },
    update: {
      value,
      updatedBy,
    },
  });
}
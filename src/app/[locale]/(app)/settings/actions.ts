"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { upsertSetting } from "@/core/settings";
import { clinicSettingsSchema } from "./schema";

export async function saveClinicSettings(
  values: {
    currency: string;
    timezone: string;
    locale: "ar" | "en";
    dateFormat: string;
  },
) {
  const user = await requirePermission("settings:write");
  const parsed = clinicSettingsSchema.parse(values);

  await Promise.all([
    upsertSetting("clinic.currency", parsed.currency, user.id),
    upsertSetting("clinic.timezone", parsed.timezone, user.id),
    upsertSetting("clinic.locale", parsed.locale, user.id),
    upsertSetting("clinic.dateFormat", parsed.dateFormat, user.id),
  ]);

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "SystemSetting",
    metadata: { keys: ["clinic.currency", "clinic.timezone", "clinic.locale", "clinic.dateFormat"] },
  });

  revalidatePath("/settings");
  return { ok: true };
}
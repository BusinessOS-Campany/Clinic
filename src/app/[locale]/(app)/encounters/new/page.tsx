import { Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { NewEncounterForm } from "@/components/encounters/new-encounter-form";

export default async function NewEncounterPage() {
  await requirePermission("encounters:write");
  const t = await getTranslations("encounters");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newEncounter")} icon={Stethoscope} />
      <NewEncounterForm />
    </div>
  );
}
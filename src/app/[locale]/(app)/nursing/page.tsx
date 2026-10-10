import { Activity } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { NursingBoard } from "@/components/nursing/nursing-board";
import { listNursingQueue } from "./actions";

export default async function NursingPage() {
  const user = await requirePermission("nursing:read");
  const locale = await getLocale();
  const t = await getTranslations("nursing");
  const canWrite = await can(user, "nursing:write");
  const rows = await listNursingQueue();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} icon={Activity} />
      <NursingBoard rows={rows} canWrite={canWrite} locale={locale} />
    </div>
  );
}

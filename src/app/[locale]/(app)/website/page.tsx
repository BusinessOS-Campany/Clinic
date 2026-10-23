import { Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function WebsitePage() {
  await requirePermission("settings:read");
  const t = await getTranslations("website");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={Globe} />
      <EmptyState icon={Globe} title={t("empty")} description={t("emptyDesc")} />
    </div>
  );
}

import { Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function CoveragesPage() {
  await requirePermission("insurance:read");
  const t = await getTranslations("coverages");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={Shield} />
      <EmptyState icon={Shield} title={t("empty")} description={t("emptyDesc")} />
    </div>
  );
}

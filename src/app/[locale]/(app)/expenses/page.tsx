import { TrendingDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function ExpensesPage() {
  await requirePermission("accounting:read");
  const t = await getTranslations("expenses");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={TrendingDown} />
      <EmptyState icon={TrendingDown} title={t("empty")} description={t("emptyDesc")} />
    </div>
  );
}

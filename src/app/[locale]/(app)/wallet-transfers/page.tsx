import { Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function WalletTransfersPage() {
  await requirePermission("financial:read");
  const t = await getTranslations("wallet-transfers");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={Wallet} />
      <EmptyState icon={Wallet} title={t("empty")} description={t("emptyDesc")} />
    </div>
  );
}

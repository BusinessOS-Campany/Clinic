import { Boxes } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { NewItemForm } from "@/components/inventory/new-item-form";

export default async function NewInventoryItemPage() {
  await requirePermission("inventory:write");
  const t = await getTranslations("inventory");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newItem")} icon={Boxes} />
      <NewItemForm />
    </div>
  );
}
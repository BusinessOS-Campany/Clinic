import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { PharmacyTabs } from "@/components/pharmacy/pharmacy-tabs";
import { InteractionManager } from "@/components/prescriptions/interaction-manager";
import { listInteractions } from "./actions";

export default async function InteractionsPage() {
  const user = await requirePermission("pharmacy:read");
  const t = await getTranslations("interactions");
  const clinicId = user.currentClinicId ?? "";
  const canManage = await can(user, "pharmacy:manage");

  const rows = await listInteractions();
  const catalog = await prisma.medication.findMany({
    where: { clinicId, isActive: true },
    select: { genericName: true },
    orderBy: { genericName: "asc" },
  });
  const drugNames = [...new Set(catalog.map((m) => m.genericName))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={ShieldAlert} description={t("description")} />
      <PharmacyTabs active="interactions" />
      <InteractionManager rows={rows} drugNames={drugNames} canManage={canManage} />
    </div>
  );
}

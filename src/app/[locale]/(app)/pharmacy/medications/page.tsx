import { Pill } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { PharmacyTabs } from "@/components/pharmacy/pharmacy-tabs";
import { MedicationCatalog } from "@/components/medications/medication-catalog";

export default async function MedicationsPage() {
  const user = await requirePermission("pharmacy:manage");
  const t = await getTranslations("medications");
  const clinicId = user.currentClinicId ?? "";
  const canManage = await can(user, "pharmacy:manage");

  const rows = await prisma.medication.findMany({
    where: { clinicId },
    orderBy: [{ genericName: "asc" }],
    take: 500,
    select: {
      id: true,
      code: true,
      genericName: true,
      brandName: true,
      strength: true,
      strengthUnit: true,
      form: true,
      route: true,
      category: true,
      isActive: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={Pill} description={t("description")} />
      <PharmacyTabs active="medications" />
      <MedicationCatalog rows={rows} canManage={canManage} />
    </div>
  );
}

import { Microscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LabEquipmentManager } from "@/components/lab/lab-equipment-manager";

export default async function LabEquipmentPage() {
  const user = await requirePermission("laboratory:read");
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";
  const canEdit = await can(user, "laboratory:verify");

  const equipment = await prisma.labEquipment.findMany({
    where: { clinicId },
    orderBy: { name: "asc" },
    include: { maintenance: { orderBy: { performedAt: "desc" }, take: 20 } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("equipment")}
        icon={Microscope}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/lab">{t("requests")}</Link>
          </Button>
        }
      />
      <LabEquipmentManager
        canEdit={canEdit}
        equipment={equipment.map((e) => ({
          id: e.id,
          name: e.name,
          serialNumber: e.serialNumber,
          manufacturer: e.manufacturer,
          model: e.model,
          location: e.location,
          lastServiceAt: e.lastServiceAt?.toISOString() ?? null,
          nextServiceDue: e.nextServiceDue?.toISOString() ?? null,
          maintenance: e.maintenance.map((m) => ({
            id: m.id,
            type: m.type,
            performedAt: m.performedAt.toISOString(),
            performedBy: m.performedBy,
            cost: m.cost === null ? null : Number(m.cost),
            notes: m.notes,
          })),
        }))}
      />
    </div>
  );
}

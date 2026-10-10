import { Pill } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DispenseForm } from "@/components/pharmacy/dispense-form";
import { PharmacyTabs } from "@/components/pharmacy/pharmacy-tabs";

export default async function PharmacyPage() {
  const user = await requirePermission("pharmacy:read");
  const locale = await getLocale();
  const t = await getTranslations("pharmacy");
  const clinicId = user.currentClinicId ?? "";
  const canDispense = await can(user, "pharmacy:dispense");

  const orders = await prisma.medicalOrder.findMany({
    where: { clinicId, kind: "MEDICATION", status: { in: ["PENDING", "ACTIVE"] } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const patientIds = [...new Set(orders.map((o) => o.patientId))];
  const patients = patientIds.length
    ? await prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          secondNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      })
    : [];
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const itemList = canDispense
    ? await prisma.inventoryItem.findMany({
        where: { clinicId, isActive: true },
        select: { id: true, code: true, nameAr: true, nameEn: true, currentQty: true, unit: true },
        orderBy: { code: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={Pill} description={`${orders.length} ${t("queue")}`} />
      <PharmacyTabs active="dispensing" />

      <div className="flex flex-col gap-3">
        {orders.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t("noPrescriptions")}</p>}
        {orders.map((order) => {
          const patient = patientById.get(order.patientId);
          return (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">
                    {order.name}
                    <Badge className="ms-2" variant={order.status === "ACTIVE" ? "info" : "secondary"}>
                      {t("status")}: {order.status}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {patient ? `${displayName(patient, locale)} · ${patient.mrn}` : order.patientId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("created")} {fmtDate(order.createdAt)}
                  </span>
                </div>
                {(order.dosage || order.frequency) && (
                  <span className="text-xs text-muted-foreground">
                    {[order.dosage, order.frequency].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              {canDispense && (
                <DispenseForm
                  orderId={order.id}
                  medicationName={order.name}
                  orderQuantity={order.quantity}
                  orderUnit={order.unit}
                  orderInstructions={order.instructions}
                  items={itemList.map((i) => ({
                    id: i.id,
                    label: `${i.code} — ${i.nameEn || i.nameAr} (${i.currentQty} ${i.unit})`,
                    disabled: i.currentQty <= 0,
                  }))}
                />
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
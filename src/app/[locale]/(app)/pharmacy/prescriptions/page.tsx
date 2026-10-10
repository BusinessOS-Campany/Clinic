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
import { PharmacyTabs } from "@/components/pharmacy/pharmacy-tabs";
import { PrescriptionDispense } from "@/components/prescriptions/prescription-dispense";

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "warning" | "destructive"> = {
  DRAFT: "secondary",
  SIGNED: "info",
  PARTIALLY_DISPENSED: "warning",
  DISPENSED: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export default async function PrescriptionsPage() {
  const user = await requirePermission("pharmacy:read");
  const locale = await getLocale();
  const t = await getTranslations("prescriptions");
  const clinicId = user.currentClinicId ?? "";
  const canDispense = await can(user, "pharmacy:dispense");

  const prescriptions = await prisma.prescription.findMany({
    where: { clinicId, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      patient: {
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          secondNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      },
      prescriber: { select: { name: true } },
      items: { orderBy: { createdAt: "asc" } },
    },
  });

  const inventory = canDispense
    ? await prisma.inventoryItem.findMany({
        where: { clinicId, isActive: true },
        select: { id: true, code: true, nameAr: true, nameEn: true, currentQty: true, unit: true },
        orderBy: { code: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={Pill} description={t("queue")} />
      <PharmacyTabs active="prescriptions" />

      <div className="flex flex-col gap-3">
        {prescriptions.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}
        {prescriptions.map((rx) => (
          <Card key={rx.id}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="font-mono">{rx.prescriptionNo}</span>
                    <Badge variant={STATUS_BADGE[rx.status] ?? "secondary"}>
                      {t(`status_${rx.status}`)}
                    </Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {displayName(rx.patient, locale)} · {rx.patient.mrn}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("prescriber")}: {rx.prescriber?.name ?? "—"} · {fmtDate(rx.createdAt)}
                  </span>
                </div>
                <a
                  className="text-sm text-primary underline"
                  href={`/prescriptions/${rx.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("print")}
                </a>
              </div>

              <ul className="flex flex-col divide-y border-t pt-1">
                {rx.items.map((it) => {
                  const ordered = Number(it.quantity);
                  const dispensed = Number(it.dispensedQty);
                  const remaining = ordered - dispensed;
                  const dispensible =
                    canDispense &&
                    remaining > 0 &&
                    (rx.status === "SIGNED" || rx.status === "PARTIALLY_DISPENSED");
                  return (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {it.medicationName}
                          {it.strength ? ` ${it.strength}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {it.dosage} · {it.frequency}
                          {it.durationDays ? ` · ${it.durationDays} ${t("days")}` : ""}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dispensed} / {ordered} {it.unit ?? ""}
                      </span>
                      {dispensible && (
                        <PrescriptionDispense
                          prescriptionItemId={it.id}
                          remaining={remaining}
                          items={inventory.map((i) => ({
                            id: i.id,
                            label: `${i.code} — ${i.nameEn || i.nameAr} (${i.currentQty} ${i.unit})`,
                            disabled: i.currentQty <= 0,
                          }))}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Stethoscope } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requirePermission } from "@/core/auth/session";
import { canAny } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { calcAge, displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PrintButton } from "@/components/encounters/print-button";

export default async function PrescriptionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const allowed = await canAny(user, ["pharmacy:read", "encounters:read"]);
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("pharmacy");
  const clinicId = user.currentClinicId ?? "";
  if (!allowed) notFound();

  const order = await prisma.medicalOrder.findFirst({
    where: { id, clinicId, kind: "MEDICATION" },
    include: {
      encounter: { include: { doctor: { select: { name: true } } } },
    },
  });
  if (!order) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: order.patientId },
    select: {
      mrn: true,
      firstNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
      birthDate: true,
    },
  });
  if (!patient) notFound();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { nameAr: true, nameEn: true, phone: true },
  });

  const doctor = order.encounter.doctor?.name ?? order.prescribedBy ?? "—";
  const className = "grid grid-cols-[150px_1fr] gap-1 text-sm";
  const labelCls = "text-muted-foreground";

  return (
    <main className="mx-auto max-w-[760px] p-6">
      <div className="mb-8 flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-lg font-bold">{locale === "ar" ? clinic?.nameAr : clinic?.nameEn}</p>
          {clinic?.phone ? <p className="text-xs text-muted-foreground">{clinic.phone}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold uppercase tracking-wide">{t("rxTitle")}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {t("rxNo")}: {order.id.slice(0, 12)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {t("rxDate")}: {fmtDate(order.createdAt, locale)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <dl className={className}>
          <dt className={labelCls}>{t("rxPatient")}</dt>
          <dd>{displayName(patient, locale)}</dd>
          <dt className={labelCls}>{t("mrn")}</dt>
          <dd>{patient.mrn}</dd>
          <dt className={labelCls}>{t("dob")}</dt>
          <dd>
            {patient.birthDate ? `${fmtDate(patient.birthDate, locale)} (${calcAge(patient.birthDate) ?? "—"})` : "—"}
          </dd>
        </dl>
        <dl className={className}>
          <dt className={labelCls}>{t("rxDoctor")}</dt>
          <dd>{doctor}</dd>
          <dt className={labelCls}>{t("rxSignature")}</dt>
          <dd className="border-b border-dashed">&nbsp;</dd>
        </dl>
      </div>

      <div className="mt-10 space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2 border-b pb-1 text-sm">
          <span className="text-base font-semibold">
            {order.brandName || order.name}
          </span>
          {order.genericName && order.genericName !== order.name && (
            <span className="text-muted-foreground">({order.genericName})</span>
          )}
          {order.priority === "URGENT" ? (
            <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground">
              {t("priority_URGENT")}
            </span>
          ) : null}
        </div>

        <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1 text-sm">
          {order.strength ? (
            <>
              <dt className={labelCls}>{t("rxStrength")}</dt>
              <dd>{order.strength}</dd>
            </>
          ) : null}
          {order.dosageForm ? (
            <>
              <dt className={labelCls}>{t("rxForm")}</dt>
              <dd>{order.dosageForm}</dd>
            </>
          ) : null}
          {order.dose ? (
            <>
              <dt className={labelCls}>{t("rxDose")}</dt>
              <dd>
                {Number(order.dose)} {order.doseUnit || ""}
              </dd>
            </>
          ) : null}
          {order.route ? (
            <>
              <dt className={labelCls}>{t("rxRoute")}</dt>
              <dd>{order.route}</dd>
            </>
          ) : null}
          {order.frequencyCode || order.frequency ? (
            <>
              <dt className={labelCls}>{t("rxFrequency")}</dt>
              <dd>{order.frequencyCode || order.frequency}</dd>
            </>
          ) : null}
          {order.durationDays ? (
            <>
              <dt className={labelCls}>{t("rxDuration")}</dt>
              <dd>{order.durationDays} d</dd>
            </>
          ) : null}
          {order.quantity ? (
            <>
              <dt className={labelCls}>{t("rxQuantity")}</dt>
              <dd>
                {order.quantity} {order.unit || ""}
              </dd>
            </>
          ) : null}
          {order.refills > 0 ? (
            <>
              <dt className={labelCls}>{t("rxRefills")}</dt>
              <dd>{order.refills}</dd>
            </>
          ) : null}
          {order.clinicalIndication ? (
            <>
              <dt className={labelCls}>{t("rxIndication")}</dt>
              <dd>{order.clinicalIndication}</dd>
            </>
          ) : null}
        </dl>

        {order.instructions && (
          <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
            <Stethoscope className="me-1 inline size-3.5 text-muted-foreground" />
            {t("rxDirections")}: {order.instructions}
          </p>
        )}

        {order.dispenseAsWritten ? (
          <p className="text-xs font-medium text-muted-foreground">{t("rxDispenseAsWritten")}</p>
        ) : null}
      </div>

      <footer className="mt-12 flex items-end justify-between text-xs text-muted-foreground">
        <span>{t("rxFooter")}</span>
        <div className="flex flex-col items-center">
          <span>&nbsp;</span>
          <span className="mt-8">{t("rxSignature")}</span>
        </div>
      </footer>

      <div className="mt-8 print:hidden">
        <PrintButton ns="pharmacy" labelKey="print" />
      </div>
    </main>
  );
}
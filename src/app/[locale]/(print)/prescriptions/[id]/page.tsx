import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PrintButton } from "@/components/prescriptions/print-button";

export default async function PrescriptionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("pharmacy:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("prescriptions");
  const tm = await getTranslations("medications");
  const clinicId = user.currentClinicId ?? "";

  const rx = await prisma.prescription.findFirst({
    where: { id, clinicId },
    include: {
      patient: true,
      clinic: true,
      prescriber: { select: { name: true } },
      encounter: { select: { encounterNo: true } },
      items: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!rx) notFound();

  const clinicName = locale === "ar" ? rx.clinic.nameAr : rx.clinic.nameEn;

  return (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{clinicName}</h1>
          {rx.clinic.address && (
            <p className="text-xs text-neutral-600">{rx.clinic.address}</p>
          )}
          {rx.clinic.phone && (
            <p className="text-xs text-neutral-600">{rx.clinic.phone}</p>
          )}
        </div>
        <PrintButton />
      </div>

      <div className="flex items-end justify-between border-b border-neutral-300 pb-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="text-end text-xs">
          <div className="font-mono text-base font-bold">{rx.prescriptionNo}</div>
          <div>{fmtDate(rx.issuedAt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase text-neutral-500">{t("patient")}</div>
          <div className="font-medium">{displayName(rx.patient, locale)}</div>
          <div className="text-xs text-neutral-600">{rx.patient.mrn}</div>
        </div>
        <div className="text-end">
          <div className="text-xs uppercase text-neutral-500">{t("prescriber")}</div>
          <div className="font-medium">{rx.prescriber?.name ?? "—"}</div>
          {rx.encounter?.encounterNo && (
            <div className="text-xs text-neutral-600">{rx.encounter.encounterNo}</div>
          )}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-300 text-xs uppercase text-neutral-500">
            <th className="py-2 text-start">{t("colMedication")}</th>
            <th className="py-2 text-start">{t("colDosage")}</th>
            <th className="py-2 text-start">{t("colFrequency")}</th>
            <th className="py-2 text-start">{t("colDuration")}</th>
            <th className="py-2 text-start">{t("colQuantity")}</th>
          </tr>
        </thead>
        <tbody>
          {rx.items.map((it) => (
            <tr key={it.id} className="border-b border-neutral-200 align-top">
              <td className="py-2">
                <div className="font-medium">
                  {it.medicationName}
                  {it.strength ? ` ${it.strength}` : ""}
                </div>
                <div className="text-xs text-neutral-600">
                  {[it.form ? tm(`form_${it.form}`) : null, it.route ? tm(`route_${it.route}`) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {it.instructions && (
                  <div className="text-xs text-neutral-600">{it.instructions}</div>
                )}
              </td>
              <td className="py-2">{it.dosage}</td>
              <td className="py-2">{it.frequency}</td>
              <td className="py-2">
                {it.durationDays ? `${it.durationDays} ${t("days")}` : "—"}
              </td>
              <td className="py-2">
                {Number(it.quantity)} {it.unit ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(rx.instructions || rx.notes) && (
        <div className="flex flex-col gap-1">
          {rx.instructions && (
            <p>
              <span className="font-medium">{t("instructions")}: </span>
              {rx.instructions}
            </p>
          )}
          {rx.notes && (
            <p>
              <span className="font-medium">{t("notes")}: </span>
              {rx.notes}
            </p>
          )}
        </div>
      )}

      <div className="flex items-end justify-between border-t border-neutral-300 pt-3">
        <div>
          {rx.followUpDate && (
            <p className="text-xs">
              <span className="font-medium">{t("followUp")}: </span>
              {fmtDate(rx.followUpDate)}
            </p>
          )}
          <p className="text-xs text-neutral-600">{t("verifyNote")}</p>
        </div>
        <div className="text-end">
          <div className="text-xs uppercase text-neutral-500">{t("verification")}</div>
          <div className="font-mono text-lg font-bold tracking-widest">
            {rx.verificationCode}
          </div>
        </div>
      </div>
    </div>
  );
}

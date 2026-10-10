import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtTime } from "@/lib/format";
import { PrintButton } from "@/components/prescriptions/print-button";

export default async function LabReportPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("laboratory:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";

  const request = await prisma.labRequest.findFirst({
    where: { id, clinicId },
    include: {
      tests: {
        orderBy: { createdAt: "asc" },
        include: {
          test: { include: { referenceRanges: true } },
          amendments: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!request) notFound();

  const clinic = await prisma.clinic.findUnique({ where: { id: request.clinicId } });
  if (!clinic) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: request.patientId },
    select: {
      mrn: true,
      gender: true,
      birthDate: true,
      firstNameAr: true,
      secondNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
    },
  });
  if (!patient) notFound();

  const clinicName = locale === "ar" ? clinic.nameAr : clinic.nameEn;

  return (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{clinicName}</h1>
          {clinic.address && <p className="text-xs text-neutral-600">{clinic.address}</p>}
          {clinic.phone && <p className="text-xs text-neutral-600">{clinic.phone}</p>}
        </div>
        <PrintButton />
      </div>

      <div className="flex items-end justify-between border-b border-neutral-300 pb-2">
        <h2 className="text-lg font-semibold">{t("reportTitle")}</h2>
        <div className="text-end text-xs">
          <div className="font-mono text-base font-bold">{request.requestNo ?? request.id.slice(-6)}</div>
          <div>{fmtDate(request.createdAt)} {fmtTime(request.createdAt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase text-neutral-500">{t("patient")}</div>
          <div className="font-medium">{displayName(patient, locale)}</div>
          <div className="text-xs text-neutral-600">{patient.mrn}</div>
        </div>
        <div className="text-end">
          <div className="text-xs uppercase text-neutral-500">{t("priority")}</div>
          <div className="font-medium">{t(`priority_${request.priority}`)}</div>
          {request.specimenType && (
            <div className="text-xs text-neutral-600">{t(`specimen_${request.specimenType}`)}</div>
          )}
        </div>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-neutral-300 text-start text-neutral-500">
            <th className="py-2 text-start">{t("testName")}</th>
            <th className="py-2 text-start">{t("resultValue")}</th>
            <th className="py-2 text-start">{t("unit")}</th>
            <th className="py-2 text-start">{t("reference")}</th>
            <th className="py-2 text-start">{t("flag")}</th>
          </tr>
        </thead>
        <tbody>
          {request.tests.map((test) => {
            const refText = test.test?.referenceRanges.find((r) => r.text)?.text ?? test.referenceRange;
            return (
              <tr key={test.id} className="border-b border-neutral-200 align-top">
                <td className="py-2 font-medium">{test.testName}</td>
                <td className="py-2">{test.resultValue ?? "—"}</td>
                <td className="py-2">{test.unit ?? ""}</td>
                <td className="py-2 text-neutral-600">{refText ?? "—"}</td>
                <td className="py-2">{test.flag ? t(`flag_${test.flag}`) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 border-t border-neutral-300 pt-4 text-xs text-neutral-600">
        <div>
          {request.collectedAt && <div>{t("collectedAt")}: {fmtDate(request.collectedAt)} {fmtTime(request.collectedAt)}</div>}
          {request.clinicalIndication && <div>{t("indication")}: {request.clinicalIndication}</div>}
        </div>
        <div className="text-end">
          {request.tests.some((x) => x.verifiedBy) && (
            <div>{t("verifiedBy")}: {request.tests.map((x) => x.verifiedBy).find(Boolean)}</div>
          )}
          {request.releasedAt && <div>{t("releasedAt")}: {fmtDate(request.releasedAt)} {fmtTime(request.releasedAt)}</div>}
        </div>
      </div>
    </div>
  );
}

import { Stethoscope } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { calcAge, displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { loadEncounterSummary } from "@/lib/encounter-summary";
import { PrintButton } from "@/components/encounters/print-button";

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v : null;

export default async function EncounterReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("encounters");
  const tp = await getTranslations("patients");
  const tv = await getTranslations("visits");
  const clinicId = user.currentClinicId ?? "";

  const encounter = await prisma.encounter.findFirst({
    where: { id, clinicId },
    include: {
      patient: true,
      doctor: { select: { name: true } },
      diagnoses: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      orders: { orderBy: { createdAt: "asc" } },
      visit: { select: { visitNumber: true, arrivedAt: true } },
    },
  });
  if (!encounter) return <p className="p-6 text-sm text-muted-foreground">404</p>;

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { nameAr: true, nameEn: true },
  });
  const summary = await loadEncounterSummary(clinicId, encounter.patientId);

  const hist = (encounter.history ?? {}) as Record<string, unknown>;
  const exam = (encounter.examination ?? {}) as Record<string, unknown>;
  const plan = (encounter.treatmentPlan ?? {}) as Record<string, unknown>;

  const Row = ({ label, value }: { label: string; value: string | null }) =>
    value ? (
      <div className="grid grid-cols-[180px_1fr] gap-2 text-sm">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="whitespace-pre-wrap">{value}</dd>
      </div>
    ) : null;

  return (
    <main className="mx-auto max-w-[820px] p-6">
      <div className="mb-6 hidden print:block text-center">
        <p className="text-lg font-bold">{locale === "ar" ? clinic?.nameAr : clinic?.nameEn}</p>
        <p className="text-sm text-muted-foreground">{t("printReport")}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{tp("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {displayName(encounter.patient, locale)} · {encounter.patient.mrn}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border p-4 text-sm">
        <div>
          <p className="font-semibold">{encounter.patient.mrn}</p>
          <p>{displayName(encounter.patient, locale)}</p>
        </div>
        <div>
          <p>{tp("dob")}: {encounter.patient.birthDate ? fmtDate(encounter.patient.birthDate, locale) : "—"}</p>
          <p>{tp("age")}: {calcAge(encounter.patient.birthDate) ?? "—"}</p>
        </div>
        {encounter.doctor?.name ? <p>{tp("doctor")}: {encounter.doctor.name}</p> : null}
        {encounter.visit ? (
          <p>{tv("status")}: {encounter.visit.visitNumber}</p>
        ) : null}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Stethoscope className="size-4" /> {t("tabSoap")}
        </h2>
        <dl className="space-y-2">
          <Row label={t("chiefComplaint")} value={encounter.chiefComplaint} />
          <Row label={t("hpi")} value={str(hist.hpi)} />
          <Row label={t("painLocation")} value={str(hist.painLocation)} />
          <Row label={t("aggravatingFactors")} value={str(hist.aggravatingFactors)} />
          <Row label={t("alleviatingFactors")} value={str(hist.alleviatingFactors)} />
          <Row label={t("subjective")} value={str(hist.ros) ?? encounter.subjective} />
          <Row label={t("pastHistory")} value={str(hist.pastHistory)} />
          <Row label={t("familyHistory")} value={str(hist.familyHistory)} />
          <Row label={t("socialHistory")} value={str(hist.socialHistory)} />
          <Row label={t("objective")} value={encounter.objective} />
          <Row label={t("physicalExamination")} value={encounter.physicalExamination} />
          <Row label={t("assessment")} value={encounter.assessment} />
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">{t("tabExam")}</h2>
        <dl className="space-y-2">
          {Object.entries(exam)
            .filter(([, v]) => str(v))
            .map(([k, v]) => (
              <Row key={k} label={t(`section_${k}`)} value={str(v)} />
            ))}
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">{t("tabDiagnoses")}</h2>
        {encounter.diagnoses.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {encounter.diagnoses.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {d.isDifferential ? "(DDx) " : d.isPrimary ? "★ " : ""}
                  {d.name}
                </span>
                {d.code ? (
                  <span className="text-muted-foreground">{d.code}</span>
                ) : null}
                {d.status ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {t(`diagnosisStatus_${d.status}`)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">{t("tabOrders")}</h2>
        {encounter.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {encounter.orders.map((o) => (
              <li key={o.id}>
                <span className="font-medium">{o.name}</span>
                <span className="text-muted-foreground">
                  {[o.genericName, o.strength, o.dosage, o.frequency, o.durationDays ? `${o.durationDays} d` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">{t("planOverview")}</h2>
        <dl className="space-y-2">
          <Row label={t("planOverview")} value={str(plan.plan)} />
          <Row label={t("clinicProcedures")} value={str(plan.clinicProcedures)} />
          <Row label={t("homeAdvice")} value={str(plan.homeAdvice)} />
          <Row label={t("dietActivity")} value={str(plan.dietActivity)} />
          <Row label={t("redFlags")} value={str(plan.redFlags)} />
          <Row label={t("planReferral")} value={str(plan.referralTo)} />
          <Row label={t("followUpDate")} value={str(plan.followUpDate)} />
          <Row label={t("patientNotes")} value={str(plan.patientNotes)} />
        </dl>
      </section>

      {summary.vitals.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">{tp("currentVitals")}</h2>
          <p className="text-sm">
            {(() => {
              const v = summary.vitals[0];
              if (!v) return null;
              return (
                <>
                  {v.temperature != null ? `${v.temperature}°C · ` : ""}
                  {v.bpSystolic != null && v.bpDiastolic != null
                    ? `${v.bpSystolic}/${v.bpDiastolic}`
                    : ""}
                </>
              );
            })()}
          </p>
        </section>
      ) : null}

      {summary.labResults.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">{tp("latestResults")}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {summary.labResults.slice(0, 8).map((r) => (
              <li key={r.id}>
                <span className="font-medium">{r.testName}</span>
                <span className="text-muted-foreground">
                  : {r.resultValue} {r.unit ?? ""}
                  {r.isAbnormal ? " ⚠" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-10 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
        <span>{encounter.doctor?.name ?? "—"}</span>
        <span>{fmtDate(encounter.updatedAt, locale)}</span>
      </footer>
    </main>
  );
}
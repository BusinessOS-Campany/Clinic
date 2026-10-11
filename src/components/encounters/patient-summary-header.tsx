import {
  BadgeCheck,
  Fingerprint,
  FlaskConical,
  HeartPulse,
  Pill,
  ReceiptText,
  ScanLine,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { calcAge } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import type { EncounterSummary } from "@/lib/encounter-summary";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function severityTone(sev: string): "secondary" | "info" | "warning" | "destructive" {
  if (sev === "SEVERE") return "destructive";
  if (sev === "MODERATE") return "warning";
  return "secondary";
}

export async function PatientSummaryHeader({
  patientName,
  mrn,
  photo,
  birthDate,
  bloodType,
  insuranceCompany,
  insurancePolicyNumber,
  summary,
  locale,
}: {
  patientName: string;
  mrn: string;
  photo: string | null;
  birthDate: Date | null;
  bloodType: string | null;
  insuranceCompany: string | null;
  insurancePolicyNumber: string | null;
  summary: EncounterSummary;
  locale: string;
}) {
  const t = await getTranslations("patients");
  const tb = await getTranslations("billing");
  const tl = await getTranslations("lab");
  const age = calcAge(birthDate);

  const title = (icon: React.ReactNode, label: string) => (
    <CardTitle className="flex items-center gap-2 text-xs font-medium text-foreground/80">
      {icon}
      {label}
    </CardTitle>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardHeader className="p-4 pb-0">{title(<BadgeCheck className="size-4" />, t("summary"))}</CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              {photo ? <AvatarImage src={photo} alt="" /> : null}
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                {patientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{patientName}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Fingerprint className="size-3" />
                {mrn}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {age !== null ? <Badge variant="secondary">{t("age")}: {age}</Badge> : null}
            {bloodType ? <Badge variant="outline">{bloodType}</Badge> : null}
            {insuranceCompany ? (
              <Badge variant="outline" className="border-success/30 text-success">
                {insuranceCompany}
                {insurancePolicyNumber ? ` · ${insurancePolicyNumber}` : ""}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="p-4 pb-0">{title(<TriangleAlert className="size-4 text-destructive" />, t("allergies"))}</CardHeader>
        <CardContent className="p-4">
          {summary.allergies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAllergies")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {summary.allergies.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{a.allergen}</span>
                  <Badge variant={severityTone(a.severity)} className="text-[10px]">
                    {a.severity}
                  </Badge>
                  {a.reaction ? (
                    <span className="text-xs text-muted-foreground">({a.reaction})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="p-4 pb-0">
          {title(<Stethoscope className="size-4" />, t("chronicConditions"))}
        </CardHeader>
        <CardContent className="p-4">
          {summary.chronicConditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noChronicConditions")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {summary.chronicConditions.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span>{d.name}</span>
                  {d.code ? (
                    <Badge variant="outline" className="text-[10px]">{d.code}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="p-4 pb-0">
          {title(<Pill className="size-4" />, t("currentMedications"))}
        </CardHeader>
        <CardContent className="p-4">
          {summary.currentMedications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noCurrentMedications")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {summary.currentMedications.map((m) => (
                <li key={m.id}>
                  <span className="font-medium">{m.name}</span>
                  {m.strength ? <span> {m.strength}</span> : null}
                  <span className="text-xs text-muted-foreground">
                    {[m.dosageForm, m.route, m.doseUnit, m.frequencyCode]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="p-4 pb-0">
          {title(<HeartPulse className="size-4 text-destructive" />, t("currentVitals"))}
        </CardHeader>
        <CardContent className="p-4">
          {summary.vitals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noVitalsRecorded")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {summary.vitals.map((v) => (
                <li key={v.id} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {fmtDate(new Date(v.recordedAt), locale)}
                  </span>
                  <span className="tabular-nums">
                    {v.temperature != null ? `${v.temperature}°C` : "—"}
                  </span>
                  <span className="tabular-nums">{v.pulse != null ? `${v.pulse} bpm` : "—"}</span>
                  <span className="tabular-nums">
                    {v.bpSystolic != null && v.bpDiastolic != null
                      ? `${v.bpSystolic}/${v.bpDiastolic}`
                      : "—"}
                  </span>
                  <span className="tabular-nums">{v.spO2 != null ? `${v.spO2}%` : "—"}</span>
                  {v.painScore != null ? <span className="text-warning">Pain {v.painScore}/10</span> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="p-4 pb-0">
          {title(<FlaskConical className="size-4" />, t("latestResults"))}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-4 text-sm">
          {summary.labResults.length === 0 && summary.imagingResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLatestResults")}</p>
          ) : (
            <>
              {summary.labResults.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <span className="w-36 shrink-0 truncate font-medium">{r.testName}</span>
                  <span className="tabular-nums">
                    {r.resultValue}
                    {r.unit ? ` ${r.unit}` : ""}
                  </span>
                  {r.isAbnormal != null && r.isAbnormal ? (
                    <Badge variant="destructive" className="text-[10px]">{tl("abnormal")}</Badge>
                  ) : null}
                </div>
              ))}
              {summary.imagingResults.slice(0, 2).map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <ScanLine className="size-3 text-muted-foreground" />
                  <span className="w-36 shrink-0 truncate font-medium">{r.modality ?? "—"}</span>
                  <span className="text-muted-foreground">{r.impression ?? r.findings}</span>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="p-4 pb-0">
          {title(<ReceiptText className="size-4" />, t("billingStatus"))}
        </CardHeader>
        <CardContent className="p-4">
          {!summary.billing ? (
            <p className="text-sm text-muted-foreground">{t("noBilling")}</p>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">
                {summary.billing.invoiceNo}
              </span>
              <Badge variant={summary.hasOutstanding ? "warning" : "success"} className="text-[10px]">
                {tb(`status_${summary.billing.status}`)}
              </Badge>
              <span className="text-muted-foreground">
                {tb("total")}: {summary.billing.total}
              </span>
              <span className={summary.hasOutstanding ? "text-destructive" : "text-success"}>
                {summary.hasOutstanding ? t("open") : t("noBilling")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="p-4 pb-0">
          {title(<Stethoscope className="size-4" />, t("recentVisits"))}
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 p-4 text-sm">
          {summary.recentVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            summary.recentVisits.slice(0, 4).map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-muted-foreground">{fmtDate(new Date(v.arrivedAt), locale)}</span>
                <span className="font-medium">{v.visitNumber}</span>
                <span className="text-muted-foreground">{v.type}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
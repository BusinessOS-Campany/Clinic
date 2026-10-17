import { GitMerge, Pencil, Printer, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Patient } from "@/lib/generated/prisma/client";
import { calcAge, displayName, initials } from "@/lib/patient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OpenVisitButton } from "@/components/patients/profile/open-visit-button";
import { DeletePatientButton } from "@/components/patients/delete-patient-button";

export async function PatientIdentity({
  patient,
  locale,
  canWrite,
  canMerge,
  mergedInto,
  mergedDuplicates,
}: {
  patient: Patient;
  locale: string;
  canWrite: boolean;
  canMerge: boolean;
  mergedInto: { id: string; mrn: string; name: string } | null;
  mergedDuplicates: { id: string; mrn: string; name: string }[];
}) {
  const t = await getTranslations("patients");
  const age = calcAge(patient.birthDate);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {initials(patient)}
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight">
                {displayName(patient, locale)}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {patient.mrn}
                </span>
                <Badge variant={patient.status === "ACTIVE" ? "success" : "secondary"}>
                  {t(patient.status === "ACTIVE" ? "statusActive" : "statusInactive")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t("gender")}:{" "}
                  {t(patient.gender === "FEMALE" ? "female" : "male")}
                  {age !== null && ` · ${t("age")}: ${age}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canWrite && <OpenVisitButton patientId={patient.id} />}
            <Button asChild variant="outline" size="sm">
              <Link href={`/patients/${patient.id}/chart`}>
                <Stethoscope />
                {t("chart")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/patients/${patient.id}/form`} target="_blank" rel="noreferrer">
                <Printer />
                {t("printForm")}
              </Link>
            </Button>
            {canMerge && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/patients/merges/new?primary=${patient.id}`}>
                  <GitMerge />
                  {t("merge")}
                </Link>
              </Button>
            )}
            {canWrite && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/patients/${patient.id}/edit`}>
                  <Pencil />
                  {t("edit")}
                </Link>
              </Button>
            )}
            {canWrite && <DeletePatientButton patientId={patient.id} />}
          </div>
        </div>

        {mergedInto && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
            <GitMerge className="size-4 text-warning" aria-hidden />
            <span>{t("mergedIntoRecord")}</span>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href={`/patients/${mergedInto.id}`} className="font-mono">
                {mergedInto.mrn}
              </Link>
            </Button>
            <span className="text-muted-foreground">{mergedInto.name}</span>
          </div>
        )}

        {mergedDuplicates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <GitMerge className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">{t("mergedRecords")}</span>
            {mergedDuplicates.map((d) => (
              <Button asChild key={d.id} variant="link" size="sm" className="h-auto p-0">
                <Link href={`/patients/${d.id}`} className="font-mono">
                  {d.mrn}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
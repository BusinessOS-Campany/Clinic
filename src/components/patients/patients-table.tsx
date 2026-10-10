import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { displayName, formatDate, initials } from "@/lib/patient";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Gender, Patient as PatientRow } from "@/lib/generated/prisma/client";

type Patient = Pick<
  PatientRow,
  | "id"
  | "mrn"
  | "patientId"
  | "firstNameAr"
  | "secondNameAr"
  | "lastNameAr"
  | "firstNameEn"
  | "lastNameEn"
  | "gender"
  | "birthDate"
  | "phone"
  | "status"
  | "createdAt"
>;

export async function PatientsTable({
  patients,
  locale,
}: {
  patients: Patient[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  if (patients.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("patientId")}</TableHead>
              <TableHead>{t("mrn")}</TableHead>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("gender")}</TableHead>
            <TableHead>{t("phone")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("registeredAt")}</TableHead>
          </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id} className="group">
                <TableCell>
                  <Link
                    href={`/patients/${p.id}`}
                    className="font-mono text-xs font-medium text-primary group-hover:underline"
                  >
                    {p.patientId}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/patients/${p.id}`}
                    className="font-mono text-xs text-muted-foreground group-hover:underline"
                  >
                    {p.mrn}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/patients/${p.id}`} className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(p)}
                    </span>
                    <span className="font-medium">{displayName(p, locale)}</span>
                  </Link>
                </TableCell>
                <TableCell>{t(p.gender === "FEMALE" ? "female" : "male")}</TableCell>
                <TableCell dir="ltr" className="text-start">
                  {p.phone || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === "ACTIVE" ? "success" : "secondary"}>
                    {t(p.status === "ACTIVE" ? "statusActive" : "statusInactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(p.createdAt, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
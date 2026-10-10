import { History } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName, formatDateTime } from "@/lib/patient";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LIMIT = 200;

export default async function RegistrationsPage() {
  const user = await requirePermission("patients:read");
  const locale = await getLocale();
  const t = await getTranslations("patients");
  const clinicId = user.currentClinicId ?? "";

  const patients = await prisma.patient.findMany({
    where: { clinicId },
    select: {
      id: true,
      mrn: true,
      patientId: true,
      firstNameAr: true,
      secondNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
      gender: true,
      status: true,
      mergedIntoId: true,
      createdBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });

  const creatorIds = [
    ...new Set(patients.map((p) => p.createdBy).filter((v): v is string => Boolean(v))),
  ];
  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(creators.map((u) => [u.id, u.name]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("registrationHistory")}
        description={t("registrationHistoryDescription")}
        icon={History}
        actions={
          <Link
            href="/patients"
            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent"
          >
            {t("backToPatients")}
          </Link>
        }
      />

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("registeredAt")}</TableHead>
                <TableHead>{t("fullName")}</TableHead>
                <TableHead>{t("patientId")}</TableHead>
                <TableHead>{t("mrn")}</TableHead>
                <TableHead>{t("gender")}</TableHead>
                <TableHead>{t("createdBy")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(p.createdAt, locale)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {displayName(p, locale)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.patientId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.mrn}
                  </TableCell>
                  <TableCell>{t(p.gender === "FEMALE" ? "female" : "male")}</TableCell>
                  <TableCell>
                    {p.createdBy ? nameById.get(p.createdBy) ?? "—" : "—"}
                  </TableCell>
                  <TableCell>
                    {p.mergedIntoId ? (
                      <Badge variant="secondary">{t("merged")}</Badge>
                    ) : (
                      <Badge variant={p.status === "ACTIVE" ? "success" : "secondary"}>
                        {t(p.status === "ACTIVE" ? "statusActive" : "statusInactive")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

import { ScanLine } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StatusFilter = "PENDING" | "PERFORMED" | "REPORTED" | "CANCELLED";

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "destructive"> = {
  PENDING: "secondary",
  PERFORMED: "info",
  REPORTED: "success",
  CANCELLED: "destructive",
};

export default async function ImagingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission("imaging:read");
  const { status } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("imaging");
  const clinicId = user.currentClinicId ?? "";

  const valid = ["PENDING", "PERFORMED", "REPORTED", "CANCELLED"].includes(status ?? "");
  const filter: StatusFilter | undefined = valid ? (status as StatusFilter) : undefined;

  const requests = await prisma.imagingRequest.findMany({
    where: { clinicId, ...(filter ? { status: filter } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const patientIds = [...new Set(requests.map((r) => r.patientId))];
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

  const open = await prisma.imagingRequest.count({
    where: { clinicId, status: { notIn: ["REPORTED", "CANCELLED"] } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={ScanLine} description={`${open} ${t("requests")}`} />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={!filter ? "default" : "outline"} size="sm">
          <Link href="/imaging">{t("status")}: All</Link>
        </Button>
        {(["PENDING", "PERFORMED", "REPORTED", "CANCELLED"] as readonly StatusFilter[]).map((s) => (
          <Button asChild key={s} variant={filter === s ? "default" : "outline"} size="sm">
            <Link href={`/imaging?status=${s}`}>{t(`status_${s}`)}</Link>
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {requests.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noRequests")}</p>}
        {requests.map((r) => {
          const patient = patientById.get(r.patientId);
          return (
            <Link
              key={r.id}
              href={`/imaging/${r.id}`}
              className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/50"
            >
              <span className="min-w-40 flex-1 font-medium">
                {patient ? displayName(patient, locale) : r.patientId}
                {patient && (
                  <span className="ms-2 font-mono text-xs text-muted-foreground">{patient.mrn}</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {r.modality ? t(`modality_${r.modality}`) : "—"}
              </span>
              <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
              <Badge variant={STATUS_BADGE[r.status] ?? "secondary"}>{t(`status_${r.status}`)}</Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
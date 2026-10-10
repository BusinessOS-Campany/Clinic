import { FlaskConical } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StatusFilter =
  | "PENDING"
  | "SAMPLED"
  | "IN_PROGRESS"
  | "RESULTED"
  | "VERIFIED"
  | "REJECTED"
  | "CANCELLED";

const STATUS_BADGE: Record<string, "secondary" | "warning" | "success" | "info" | "destructive" | "outline"> = {
  PENDING: "secondary",
  SAMPLED: "info",
  IN_PROGRESS: "warning",
  RESULTED: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
};

const STATUS_FILTERS: StatusFilter[] = [
  "PENDING",
  "SAMPLED",
  "IN_PROGRESS",
  "RESULTED",
  "VERIFIED",
  "REJECTED",
  "CANCELLED",
];

const PRIORITY_BADGE: Record<string, "secondary" | "warning" | "destructive"> = {
  ROUTINE: "secondary",
  URGENT: "warning",
  STAT: "destructive",
};

const patientSelect = {
  id: true,
  mrn: true,
  firstNameAr: true,
  secondNameAr: true,
  lastNameAr: true,
  firstNameEn: true,
  lastNameEn: true,
} as const;

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission("laboratory:read");
  const { status } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";

  const filter: StatusFilter | undefined = STATUS_FILTERS.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : undefined;

  const requests = await prisma.labRequest.findMany({
    where: { clinicId, ...(filter ? { status: filter } : {}) },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const patientIds = [...new Set(requests.map((r) => r.patientId))];
  const patients = patientIds.length
    ? await prisma.patient.findMany({ where: { id: { in: patientIds } }, select: patientSelect })
    : [];
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const counts = await prisma.labResult.groupBy({
    by: ["requestId"],
    where: { requestId: { in: requests.map((r) => r.id) } },
    _count: { _all: true },
  });
  const countByReq = new Map(counts.map((c) => [c.requestId, c._count._all]));

  const critical = await prisma.labRequest.count({
    where: { clinicId, criticalFlag: true, criticalNotedAt: null },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={FlaskConical}
        description={critical > 0 ? t("criticalPending", { count: critical }) : undefined}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/lab/tests">{t("tests")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/lab/qc">{t("qc")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/lab/equipment">{t("equipment")}</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={!filter ? "default" : "outline"} size="sm">
          <Link href="/lab">{t("status")}</Link>
        </Button>
        {STATUS_FILTERS.map((s) => (
          <Button key={s} asChild variant={filter === s ? "default" : "outline"} size="sm">
            <Link href={`/lab?status=${s}`}>{t(`status_${s}`)}</Link>
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {requests.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">—</p>
        )}
        {requests.map((r) => {
          const patient = patientById.get(r.patientId);
          return (
            <Link
              key={r.id}
              href={`/lab/requests/${r.id}`}
              className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/50"
            >
              <div className="flex min-w-40 flex-1 flex-col">
                <span className="font-medium">
                  {patient ? displayName(patient, locale) : r.patientId}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {r.requestNo ?? r.id.slice(-6)}
                  {patient ? ` · ${patient.mrn}` : ""}
                </span>
              </div>
              {r.priority !== "ROUTINE" && (
                <Badge variant={PRIORITY_BADGE[r.priority] ?? "secondary"}>{t(`priority_${r.priority}`)}</Badge>
              )}
              {r.criticalFlag && <Badge variant="destructive">{t("critical")}</Badge>}
              <span className="text-xs text-muted-foreground">
                {countByReq.get(r.id) ?? 0} {t("testsCount")}
              </span>
              <span className="text-xs text-muted-foreground">
                {fmtDate(r.createdAt)} {fmtTime(r.createdAt)}
              </span>
              <Badge variant={STATUS_BADGE[r.status] ?? "secondary"}>{t(`status_${r.status}`)}</Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

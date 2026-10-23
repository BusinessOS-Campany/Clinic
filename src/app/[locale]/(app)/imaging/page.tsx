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
import { FilterBar, FilterPill } from "@/components/data/filter-bar";
import { ListShell, ListGridRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

type StatusFilter = "PENDING" | "PERFORMED" | "REPORTED" | "CANCELLED";

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
    include: { order: { select: { priority: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const sortedRequests = [...requests].sort(
    (a, b) => (a.order?.priority === "URGENT" ? 0 : 1) - (b.order?.priority === "URGENT" ? 0 : 1),
  );

  const patientIds = [...new Set(requests.map((r) => r.patientId))];
const patients = (
    patientIds.length
      ? await prisma.patient.findMany({
          where: { id: { in: patientIds } },
          select: {
            id: true,
            mrn: true,
            firstNameAr: true,
            lastNameAr: true,
            firstNameEn: true,
            lastNameEn: true,
          },
        })
      : []
  );
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const open = await prisma.imagingRequest.count({
    where: { clinicId, status: { notIn: ["REPORTED", "CANCELLED"] } },
  });

  const filters: StatusFilter[] = ["PENDING", "PERFORMED", "REPORTED", "CANCELLED"];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={ScanLine} description={`${open} ${t("requests")}`} />

      <FilterBar>
        <FilterPill href="/imaging" active={!filter} count={requests.length}>
          {t("status")}: All
        </FilterPill>
        {filters.map((s) => (
          <FilterPill key={s} href={`/imaging?status=${s}`} active={filter === s}>
            {t(`status_${s}`)}
          </FilterPill>
        ))}
      </FilterBar>

      <ListShell
        columns={[
          { label: t("patient"), className: "min-w-40 flex-1" },
          { label: t("modality"), className: "shrink-0" },
          { label: t("createdAt"), className: "shrink-0" },
          { label: t("status"), className: "shrink-0 text-right" },
        ]}
      >
        {requests.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noRequests")} description={t("noRequestsDesc")} />
        ) : (
          sortedRequests.map((r, i) => {
            const patient = patientById.get(r.patientId);
            return (
              <ListGridRow key={r.id} href={`/imaging/${r.id}`} index={i}>
                <span className="flex min-w-0 flex-1 items-center gap-2 font-medium truncate">
                  {patient ? displayName(patient, locale) : r.patientId}
                  {patient && (
                    <span className="ms-2 font-mono text-xs text-muted-foreground">{patient.mrn}</span>
                  )}
                  {r.order?.priority === "URGENT" && (
                    <Badge variant="destructive">{t("priority_URGENT")}</Badge>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">{r.modality ? t(`modality_${r.modality}`) : "—"}</span>
                <span className="shrink-0 text-muted-foreground">{fmtDate(r.createdAt)}</span>
                <span className="shrink-0 text-right">
                  <StatusBadge status={r.status}>{t(`status_${r.status}`)}</StatusBadge>
                </span>
              </ListGridRow>
            );
          })
        )}
      </ListShell>
    </div>
  );
}
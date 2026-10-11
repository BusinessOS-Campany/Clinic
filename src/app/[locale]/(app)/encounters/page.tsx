import { Plus, Stethoscope } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterBar, FilterPill } from "@/components/data/filter-bar";
import { ListShell, ListRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

export default async function EncountersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const { status } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("encounters");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "encounters:write");

  const filter = status === "COMPLETED" || status === "IN_PROGRESS" ? status : undefined;

  const rows = await prisma.encounter.findMany({
    where: { clinicId, ...(filter ? { status: filter } : {}) },
    include: {
      patient: {
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      },
      doctor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={Stethoscope}
        description={t("subtitle")}
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/encounters/new">
                <Plus />
                {t("newEncounter")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <FilterPill href="/encounters" active={!filter} count={rows.length}>
          {t("status")}: All
        </FilterPill>
        <FilterPill href="/encounters?status=IN_PROGRESS" active={filter === "IN_PROGRESS"}>
          {t("inProgress")}
        </FilterPill>
        <FilterPill href="/encounters?status=COMPLETED" active={filter === "COMPLETED"}>
          {t("completed")}
        </FilterPill>
      </FilterBar>

      <ListShell>
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noEncounters")} description={t("noEncountersDesc")} />
        ) : (
          rows.map((e, i) => (
            <ListRow key={e.id} href={`/encounters/${e.id}`} index={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium truncate">{displayName(e.patient, locale)}</span>
                <span className="text-xs font-mono text-muted-foreground">{e.patient.mrn}</span>
              </div>
              <span className="shrink-0 text-muted-foreground">{e.doctor?.name ?? "—"}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {fmtTime(e.startedAt ?? e.createdAt)}
              </span>
              <StatusBadge status={e.status}>
                {e.status === "COMPLETED" ? t("completed") : t("inProgress")}
              </StatusBadge>
            </ListRow>
          ))
        )}
      </ListShell>
    </div>
  );
}
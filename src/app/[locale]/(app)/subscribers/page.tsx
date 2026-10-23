import { UserCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtInt } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { ListShell, ListRow } from "@/components/data/list-shell";
import { EmptyState } from "@/components/empty-state";

export default async function SubscribersPage() {
  const user = await requirePermission("patients:read");
  const locale = await getLocale();
  const t = await getTranslations("subscribers");
  const clinicId = user.currentClinicId ?? "";

  const subscribers = await prisma.patient.findMany({
    where: { clinicId, encounters: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      mrn: true,
      phone: true,
      firstNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
      _count: { select: { encounters: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={UserCheck} />

      <ListShell>
        {subscribers.length === 0 ? (
          <EmptyState icon={UserCheck} title={t("empty")} description={t("emptyDesc")} />
        ) : (
          subscribers.map((p, i) => (
            <ListRow key={p.id} href={`/patients/${p.id}/chart`} index={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-medium">{displayName(p, locale)}</span>
                <span className="font-mono text-xs text-muted-foreground">{p.mrn}</span>
              </div>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {p.phone ?? "—"}
              </span>
              <StatusCount count={p._count.encounters} label={t("visits")} emptyLabel={t("noVisits")} />
            </ListRow>
          ))
        )}
      </ListShell>
    </div>
  );
}

function StatusCount({
  count,
  label,
  emptyLabel,
}: {
  count: number;
  label: string;
  emptyLabel: string;
}) {
  if (count === 0) {
    return <span className="shrink-0 text-xs text-muted-foreground">{emptyLabel}</span>;
  }
  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
      {fmtInt(count)} {label}
    </span>
  );
}

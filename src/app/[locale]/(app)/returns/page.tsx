import { Inbox, Repeat } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { ListShell, ListRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function ReturnsPage() {
  const user = await requirePermission("encounters:read");
  const locale = await getLocale();
  const t = await getTranslations("returns");
  const te = await getTranslations("encounters");
  const clinicId = user.currentClinicId ?? "";
  const isPhysician = user.roleCode === "physician";

  const rows = await prisma.encounter.findMany({
    where: {
      clinicId,
      type: "FOLLOW_UP",
      ...(isPhysician ? { doctorId: user.id } : {}),
    },
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
      <PageHeader title={t("title")} icon={Repeat} description={t("subtitle")} />

      <ListShell>
        {rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t("noReturns")}
            description={t("noReturnsDesc")}
          />
        ) : (
          rows.map((e, i) => (
            <ListRow key={e.id} href={`/encounters/${e.id}`} index={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium truncate">
                  {displayName(e.patient, locale)}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {e.patient.mrn}
                </span>
              </div>
              <span className="shrink-0 text-muted-foreground">
                {e.doctor?.name ?? "—"}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {fmtTime(e.startedAt ?? e.createdAt)}
              </span>
              <StatusBadge status={e.status}>
                {e.status === "COMPLETED" ? te("completed") : te("inProgress")}
              </StatusBadge>
            </ListRow>
          ))
        )}
      </ListShell>
    </div>
  );
}

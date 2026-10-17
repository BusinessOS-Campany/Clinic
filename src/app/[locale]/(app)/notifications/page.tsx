import { Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { ListShell, ListRow } from "@/components/data/list-shell";
import { StatusBadge, type StatusTone } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";

const STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "warning",
  QUEUED: "warning",
  SENT: "info",
  DELIVERED: "success",
  FAILED: "danger",
  EXPIRED: "muted",
  CANCELLED: "muted",
};

export default async function NotificationsPage() {
  const user = await requirePermission("notifications:read");
  const t = await getTranslations("notifications");
  const clinicId = user.currentClinicId ?? "";

  const rows = await prisma.notification.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      body: true,
      channel: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={Bell} />

      <ListShell>
        {rows.length === 0 ? (
          <EmptyState icon={Bell} title={t("empty")} description={t("emptyDesc")} />
        ) : (
          rows.map((n, i) => (
            <ListRow key={n.id} index={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-medium">{n.subject ?? n.body}</span>
                {n.subject && (
                  <span className="truncate text-xs text-muted-foreground">{n.body}</span>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {t(`channel_${n.channel}`)}
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {fmtDate(n.createdAt)}
              </span>
              <span className="hidden shrink-0 font-mono text-xs text-muted-foreground md:inline">
                {fmtTime(n.createdAt)}
              </span>
              <StatusBadge status={n.status} tone={STATUS_TONE[n.status] ?? "default"}>
                {t(`status_${n.status}`)}
              </StatusBadge>
            </ListRow>
          ))
        )}
      </ListShell>
    </div>
  );
}

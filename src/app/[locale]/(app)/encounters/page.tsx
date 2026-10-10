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

export default async function EncountersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const { status } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("encounters");
  const tc = await getTranslations("common");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "encounters:write");

  const filter =
    status === "active" || status === "completed" || status === "cancelled"
      ? status
      : undefined;
  const statusWhere =
    filter === "active"
      ? { status: { in: ["CHECKED_IN", "TRIAGE", "IN_CONSULTATION"] as never[] } }
      : filter === "completed"
        ? { status: { in: ["COMPLETED", "SIGNED"] as never[] } }
        : filter === "cancelled"
          ? { status: "CANCELLED" as never }
          : {};

  const rows = await prisma.encounter.findMany({
    where: { clinicId, ...statusWhere },
    include: {
      patient: {
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          secondNameAr: true,
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

      <div className="flex gap-2">
        <Button asChild variant={filter ? "outline" : "default"} size="sm">
          <Link href="/encounters">{t("status")}: {tc("all")}</Link>
        </Button>
        <Button asChild variant={filter === "active" ? "default" : "outline"} size="sm">
          <Link href="/encounters?status=active">{t("inProgress")}</Link>
        </Button>
        <Button asChild variant={filter === "completed" ? "default" : "outline"} size="sm">
          <Link href="/encounters?status=completed">{t("completed")}</Link>
        </Button>
        <Button asChild variant={filter === "cancelled" ? "default" : "outline"} size="sm">
          <Link href="/encounters?status=cancelled">{t("status_CANCELLED")}</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">—</p>
        )}
        {rows.map((e) => (
          <Link
            key={e.id}
            href={`/encounters/${e.id}`}
            className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/50"
          >
            <div className="min-w-40 flex-1">
              <span className="font-medium">{displayName(e.patient, locale)}</span>
              <span className="ms-2 font-mono text-xs text-muted-foreground">{e.patient.mrn}</span>
            </div>
            <span className="text-muted-foreground">{e.doctor?.name ?? "—"}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {fmtTime(e.startedAt ?? e.createdAt)}
            </span>
            <Badge
              variant={
                e.status === "COMPLETED" || e.status === "SIGNED"
                  ? "success"
                  : e.status === "CANCELLED"
                    ? "destructive"
                    : "warning"
              }
            >
              {t(`status_${e.status}`)}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
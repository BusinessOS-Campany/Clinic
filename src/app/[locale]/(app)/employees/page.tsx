import { Briefcase } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { ListShell, ListRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function EmployeesPage() {
  const user = await requirePermission("staff:read");
  const locale = await getLocale();
  const t = await getTranslations("employees");
  const tu = await getTranslations("users");
  const clinicId = user.currentClinicId;

  const employees = await prisma.user.findMany({
    where: clinicId ? { clinicId } : {},
    include: {
      role: { select: { code: true, nameAr: true, nameEn: true } },
      department: { select: { nameAr: true, nameEn: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={Briefcase} />

      <ListShell>
        {employees.length === 0 ? (
          <EmptyState icon={Briefcase} title={t("empty")} description={t("emptyDesc")} />
        ) : (
          employees.map((e, i) => (
            <ListRow key={e.id} index={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-medium">{e.nameAr ?? e.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {e.username ?? e.email}
                </span>
              </div>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                {e.department
                  ? locale === "ar"
                    ? e.department.nameAr
                    : e.department.nameEn
                  : "—"}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {locale === "ar" ? e.role.nameAr : e.role.nameEn}
              </span>
              <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
                {fmtDate(e.createdAt, locale)}
              </span>
              <StatusBadge status={e.isActive ? "ACTIVE_USER" : "INACTIVE"}>
                {e.isActive ? tu("active") : tu("inactive")}
              </StatusBadge>
            </ListRow>
          ))
        )}
      </ListShell>
    </div>
  );
}

import { CalendarDays } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SchedulingBoard } from "@/components/scheduling/scheduling-board";

export default async function SchedulingPage() {
  const user = await requirePermission("scheduling:read");
  const locale = await getLocale();
  const t = await getTranslations("scheduling");
  const canWrite = await can(user, "scheduling:write");

  const physicians = await prisma.user.findMany({
    where: { isActive: true, role: { code: "physician" } },
    select: { id: true, name: true, nameAr: true, nameEn: true },
    orderBy: { name: "asc" },
  });

  const source =
    physicians.length > 0
      ? physicians
      : await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, nameAr: true, nameEn: true },
          orderBy: { name: "asc" },
        });

  const doctors = source.map((u) => ({
    id: u.id,
    label:
      locale === "ar"
        ? u.nameAr || u.name
        : u.nameEn || u.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={CalendarDays}
      />
      <SchedulingBoard doctors={doctors} canWrite={canWrite} />
    </div>
  );
}

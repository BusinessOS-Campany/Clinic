import { Plus, Stethoscope } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PatientChartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("encounters:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("encounters");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "encounters:write");

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId },
    select: {
      id: true,
      mrn: true,
      firstNameAr: true,
      secondNameAr: true,
      lastNameAr: true,
      firstNameEn: true,
      lastNameEn: true,
    },
  });
  if (!patient) notFound();

  const encounters = await prisma.encounter.findMany({
    where: { patientId: id, clinicId },
    include: {
      doctor: { select: { name: true } },
      _count: {
        select: { diagnoses: true, orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={displayName(patient, locale)}
        icon={Stethoscope}
        description={`${patient.mrn} · ${t("chart")}`}
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

      <div className="overflow-hidden rounded-xl border bg-card">
        {encounters.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">—</p>
        )}
        {encounters.map((e) => (
          <Link
            key={e.id}
            href={`/encounters/${e.id}`}
            className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/50"
          >
            <span className="flex-1 font-medium">
              {fmtDate(e.createdAt)}
              <span className="ms-2 text-muted-foreground">{e.doctor?.name ?? "—"}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {e._count.diagnoses} {t("diagnoses")} · {e._count.orders} {t("orders")}
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
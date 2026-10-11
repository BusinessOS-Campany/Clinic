import { ListOrdered } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import {
  QueueBoard,
  type QueueColumn,
} from "@/components/queue/queue-board";

export default async function QueuePage() {
  const user = await requirePermission("queue:read");
  const locale = await getLocale();
  const t = await getTranslations("queue");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "queue:write");
  const canViewEncounter = await can(user, "encounters:read");
  const isPhysician = user.roleCode === "physician";

  const queues = await prisma.queue.findMany({
    where: { clinicId, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      entries: {
        where: { status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } },
        orderBy: [
          { priority: "desc" },
          { visit: { arrivedAt: "asc" } },
          { position: "asc" },
        ],
        include: {
          visit: {
            include: {
              doctor: { select: { name: true } },
              patient: {
                select: {
                  id: true,
                  firstNameAr: true,
                  lastNameAr: true,
                  firstNameEn: true,
                  lastNameEn: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const columns: QueueColumn[] = queues.map((queue) => {
    const scoped =
      isPhysician && queue.kind === "DOCTOR"
        ? queue.entries.filter((e) => e.visit.doctorId === user.id)
        : queue.entries;

    return {
      id: queue.id,
      name: locale === "ar" ? queue.nameAr : queue.nameEn,
      kind: queue.kind,
      entries: scoped.map((entry) => ({
        id: entry.id,
        patientId: entry.visit.patient.id,
        patientName: displayName(entry.visit.patient, locale),
        mrn: entry.visit.mrn,
        time: fmtTime(entry.visit.arrivedAt),
        status: entry.status,
        priority: entry.visit.priority,
        position: entry.position,
        doctorName: entry.visit.doctor?.name ?? null,
        encounterId: entry.visit.encounterId,
        canViewEncounter,
      })),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={ListOrdered} description={t("subtitle")} />
      <QueueBoard columns={columns} canWrite={canWrite} />
    </div>
  );
}

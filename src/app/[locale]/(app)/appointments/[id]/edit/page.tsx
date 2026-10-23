import { CalendarClock } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { toISODate } from "@/lib/dates";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("appointments:write");
  const { id } = await params;
  const locale = await getLocale();
  const clinicId = user.currentClinicId ?? "";

  const appointment = await prisma.appointment.findFirst({
    where: { id, clinicId },
    include: {
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
  });
  if (!appointment) notFound();

  const canWrite = await can(user, "appointments:write");
  if (!canWrite) notFound();

  const physicianUsers = await prisma.user.findMany({
    where: { clinicId, isActive: true, role: { code: "physician" } },
    select: { id: true, name: true, nameAr: true, nameEn: true },
    orderBy: { name: "asc" },
  });
  const doctorUsers =
    physicianUsers.length > 0
      ? physicianUsers
      : await prisma.user.findMany({
          where: { clinicId, isActive: true },
          select: { id: true, name: true, nameAr: true, nameEn: true },
          orderBy: { name: "asc" },
        });

  const departments = await prisma.department.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, nameAr: true, nameEn: true },
    orderBy: { nameAr: "asc" },
  });
  const rooms = await prisma.room.findMany({
    where: { clinicId, isActive: true },
    select: { id: true, nameAr: true, nameEn: true },
    orderBy: { nameAr: "asc" },
  });

  const opt = (rows: { id: string; nameAr: string; nameEn: string }[]) =>
    rows.map((r) => ({
      id: r.id,
      label: locale === "ar" && r.nameAr ? r.nameAr : r.nameEn,
    }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`${displayName(appointment.patient, locale)}`} icon={CalendarClock} />
      <Card>
        <CardContent className="pt-6">
          <AppointmentForm
            appointmentId={appointment.id}
            doctors={opt(doctorUsers as { id: string; nameAr: string; nameEn: string }[])}
            departments={opt(departments as { id: string; nameAr: string; nameEn: string }[])}
            rooms={opt(rooms as { id: string; nameAr: string; nameEn: string }[])}
            initial={{
              patientId: appointment.patientId,
              patientLabel: displayName(appointment.patient, locale),
              doctorId: appointment.doctorId ?? "",
              departmentId: appointment.departmentId ?? undefined,
              roomId: appointment.roomId ?? undefined,
              date: toISODate(appointment.startTime),
              startTime: `${String(appointment.startTime.getUTCHours()).padStart(2, "0")}:${String(appointment.startTime.getUTCMinutes()).padStart(2, "0")}`,
              durationMinutes: appointment.durationMinutes,
              type: appointment.type,
              reason: appointment.reason ?? undefined,
              notes: appointment.notes ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
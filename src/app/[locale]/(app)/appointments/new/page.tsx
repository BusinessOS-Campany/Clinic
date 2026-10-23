import { CalendarPlus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; start?: string }>;
}) {
  const user = await requirePermission("appointments:write");
  const { date, start } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("appointments");
  const clinicId = user.currentClinicId ?? "";

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

  const opt = (
    rows: { id: string; nameAr: string; nameEn: string }[],
  ) =>
    rows.map((r) => ({
      id: r.id,
      label: locale === "ar" && r.nameAr ? r.nameAr : r.nameEn,
    }));

  const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const validStart = start && /^([01]\d|2[0-3]):[0-5]\d$/.test(start) ? start : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newAppointment")} icon={CalendarPlus} />
      <Card>
        <CardContent className="pt-6">
          <AppointmentForm
            doctors={opt(doctorUsers as { id: string; nameAr: string; nameEn: string }[])}
            departments={opt(departments as { id: string; nameAr: string; nameEn: string }[])}
            rooms={opt(rooms as { id: string; nameAr: string; nameEn: string }[])}
            initial={{ date: validDate, startTime: validStart }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
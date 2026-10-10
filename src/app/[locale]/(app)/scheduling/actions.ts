"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import type { AppointmentStatus } from "@/lib/generated/prisma/client";
import {
  availabilityQuerySchema,
  exceptionSchema,
  saveScheduleSchema,
  type ExceptionValues,
  type SaveScheduleValues,
} from "./schema";
import { computeSlots, type AvailabilitySlot } from "./availability";

const NON_BLOCKING: AppointmentStatus[] = ["CANCELLED", "NO_SHOW"];

export type ScheduleRow = {
  weekday: number;
  isActive: boolean;
  startMinute: number;
  endMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
  slotMinutes: number;
};

export type ScheduleExceptionRow = {
  id: string;
  date: string;
  type: string;
  startMinute: number | null;
  endMinute: number | null;
  reason: string | null;
};

const DEFAULT_ROW = {
  isActive: false,
  startMinute: 9 * 60,
  endMinute: 17 * 60,
  breakStartMinute: 12 * 60,
  breakEndMinute: 13 * 60,
  slotMinutes: 30,
};

export async function getDoctorSchedules(
  doctorId: string,
): Promise<ScheduleRow[]> {
  const user = await requirePermission("scheduling:read");
  const clinicId = user.currentClinicId ?? "";
  const existing = await prisma.doctorSchedule.findMany({
    where: { clinicId, doctorId },
  });
  const byWeekday = new Map(existing.map((r) => [r.weekday, r]));
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const r = byWeekday.get(weekday);
    return {
      weekday,
      isActive: r?.isActive ?? DEFAULT_ROW.isActive,
      startMinute: r?.startMinute ?? DEFAULT_ROW.startMinute,
      endMinute: r?.endMinute ?? DEFAULT_ROW.endMinute,
      breakStartMinute: r ? r.breakStartMinute : DEFAULT_ROW.breakStartMinute,
      breakEndMinute: r ? r.breakEndMinute : DEFAULT_ROW.breakEndMinute,
      slotMinutes: r?.slotMinutes ?? DEFAULT_ROW.slotMinutes,
    };
  });
}

export async function saveDoctorSchedule(
  values: SaveScheduleValues,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requirePermission("scheduling:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = saveScheduleSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { doctorId, rows } = parsed.data;

  const doctor = await prisma.user.findFirst({
    where: { id: doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) return { ok: false, error: "not-found" };

  await prisma.$transaction([
    prisma.doctorSchedule.deleteMany({ where: { clinicId, doctorId } }),
    ...rows
      .filter((r) => r.isActive)
      .map((r) =>
        prisma.doctorSchedule.create({
          data: {
            clinicId,
            doctorId,
            weekday: r.weekday,
            startMinute: r.startMinute,
            endMinute: r.endMinute,
            breakStartMinute: r.breakStartMinute,
            breakEndMinute: r.breakEndMinute,
            slotMinutes: r.slotMinutes,
            isActive: true,
          },
        }),
      ),
  ]);

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "DoctorSchedule",
    entityId: doctorId,
    clinicId,
    metadata: { doctorId, activeDays: rows.filter((r) => r.isActive).length },
  });
  revalidatePath("/scheduling");
  revalidatePath("/appointments");
  return { ok: true };
}

export async function listScheduleExceptions(
  doctorId: string,
): Promise<ScheduleExceptionRow[]> {
  const user = await requirePermission("scheduling:read");
  const clinicId = user.currentClinicId ?? "";
  const rows = await prisma.scheduleException.findMany({
    where: { clinicId, doctorId },
    orderBy: { date: "asc" },
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
    type: r.type,
    startMinute: r.startMinute,
    endMinute: r.endMinute,
    reason: r.reason,
  }));
}

export async function addScheduleException(
  values: ExceptionValues,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requirePermission("scheduling:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = exceptionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const needsRange = v.type === "EXTRA_HOURS";
  if (needsRange && (v.startMinute == null || v.endMinute == null)) {
    return { ok: false, error: "invalid" };
  }
  if (
    v.startMinute != null &&
    v.endMinute != null &&
    v.endMinute <= v.startMinute
  ) {
    return { ok: false, error: "invalid" };
  }

  const created = await prisma.scheduleException.create({
    data: {
      clinicId,
      doctorId: v.doctorId,
      date: new Date(`${v.date}T00:00:00Z`),
      type: v.type,
      startMinute: v.startMinute,
      endMinute: v.endMinute,
      reason: v.reason || null,
      createdBy: user.id,
    },
    select: { id: true },
  });

  recordAudit({
    actorId: user.id,
    action: "create",
    entity: "ScheduleException",
    entityId: created.id,
    clinicId,
    metadata: { doctorId: v.doctorId, date: v.date, type: v.type },
  });
  revalidatePath("/scheduling");
  revalidatePath("/appointments");
  return { ok: true, id: created.id };
}

export async function deleteScheduleException(
  id: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requirePermission("scheduling:write");
  const clinicId = user.currentClinicId;
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const res = await prisma.scheduleException.deleteMany({
    where: { id, clinicId },
  });
  if (res.count === 0) return { ok: false, error: "not-found" };

  recordAudit({
    actorId: user.id,
    action: "update",
    entity: "ScheduleException",
    entityId: id,
    clinicId,
    metadata: { deleted: true },
  });
  revalidatePath("/scheduling");
  revalidatePath("/appointments");
  return { ok: true, id };
}

export async function getAvailableSlots(values: {
  doctorId: string;
  date: string;
}): Promise<AvailabilitySlot[]> {
  const user = await requirePermission("scheduling:read");
  const clinicId = user.currentClinicId ?? "";
  const parsed = availabilityQuerySchema.safeParse(values);
  if (!parsed.success) return [];
  const { doctorId, date } = parsed.data;

  const dayStart = new Date(`${date}T00:00:00Z`);
  const weekday = dayStart.getUTCDay();

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { clinicId, doctorId, weekday, isActive: true },
  });

  const exceptions = await prisma.scheduleException.findMany({
    where: { clinicId, doctorId, date: dayStart },
  });

  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const appts = await prisma.appointment.findMany({
    where: {
      clinicId,
      doctorId,
      status: { notIn: NON_BLOCKING as never[] },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { id: true, startTime: true, endTime: true },
  });

  return computeSlots({
    schedule: schedule
      ? {
          isActive: schedule.isActive,
          startMinute: schedule.startMinute,
          endMinute: schedule.endMinute,
          breakStartMinute: schedule.breakStartMinute,
          breakEndMinute: schedule.breakEndMinute,
          slotMinutes: schedule.slotMinutes,
        }
      : null,
    exceptions: exceptions.map((e) => ({
      type: e.type,
      startMinute: e.startMinute,
      endMinute: e.endMinute,
    })),
    appointments: appts.map((a) => ({
      id: a.id,
      startMs: a.startTime.getTime(),
      endMs: a.endTime.getTime(),
    })),
    dayStartMs: dayStart.getTime(),
  });
}

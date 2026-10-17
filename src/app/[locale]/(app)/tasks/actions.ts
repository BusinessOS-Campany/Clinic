"use server";

import { revalidatePath } from "next/cache";
import { requireAnyPermission } from "@/core/auth/session";
import { recordAudit } from "@/core/audit";
import { prisma } from "@/lib/db";
import { taskCreateSchema, taskIdSchema, taskUpdateSchema } from "./schema";

export type TaskDTO = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  dueDate: string | null;
  completedAt: string | null;
};

type Result =
  | { ok: true; task?: TaskDTO }
  | { ok: false; error: "no-clinic" | "invalid" | "not-found" };

function toDTO(task: {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
}): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    status: task.status as TaskDTO["status"],
    priority: task.priority as TaskDTO["priority"],
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}

async function ensurePermission() {
  return requireAnyPermission(["patients:write", "reception:write", "encounters:write"]);
}

function revalidateDashboard() {
  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/tasks");
  revalidatePath("/en/tasks");
}

export async function createTask(input: unknown): Promise<Result> {
  const user = await ensurePermission();
  const clinicId = user.currentClinicId ?? "";
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = taskCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

  const task = await prisma.task.create({
    data: {
      clinicId,
      title: parsed.data.title,
      priority: parsed.data.priority,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null,
      createdById: user.id,
    },
  });

  recordAudit({
    actorId: user.id,
    clinicId,
    action: "create",
    entity: "Task",
    entityId: task.id,
    metadata: { title: task.title, priority: task.priority },
  });
  revalidateDashboard();
  return { ok: true, task: toDTO(task) };
}

export async function updateTask(input: unknown): Promise<Result> {
  const user = await ensurePermission();
  const clinicId = user.currentClinicId ?? "";
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const existing = await prisma.task.findFirst({
    where: { id: parsed.data.id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const dueDate =
    parsed.data.dueDate === undefined
      ? undefined
      : parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : null;

  const task = await prisma.task.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(dueDate !== undefined
        ? { dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null }
        : {}),
    },
  });

  recordAudit({
    actorId: user.id,
    clinicId,
    action: "update",
    entity: "Task",
    entityId: task.id,
  });
  revalidateDashboard();
  return { ok: true, task: toDTO(task) };
}

export async function toggleTask(input: unknown): Promise<Result> {
  const user = await ensurePermission();
  const clinicId = user.currentClinicId ?? "";
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = taskIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const existing = await prisma.task.findFirst({
    where: { id: parsed.data.id, clinicId },
    select: { id: true, status: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  const done = existing.status === "DONE";
  const task = await prisma.task.update({
    where: { id: parsed.data.id },
    data: {
      status: done ? "TODO" : "DONE",
      completedAt: done ? null : new Date(),
    },
  });

  recordAudit({
    actorId: user.id,
    clinicId,
    action: "update",
    entity: "Task",
    entityId: task.id,
    metadata: { status: task.status },
  });
  revalidateDashboard();
  return { ok: true, task: toDTO(task) };
}

export async function deleteTask(input: unknown): Promise<Result> {
  const user = await ensurePermission();
  const clinicId = user.currentClinicId ?? "";
  if (!clinicId) return { ok: false, error: "no-clinic" };

  const parsed = taskIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const existing = await prisma.task.findFirst({
    where: { id: parsed.data.id, clinicId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "not-found" };

  await prisma.task.delete({ where: { id: parsed.data.id } });

  recordAudit({
    actorId: user.id,
    clinicId,
    action: "delete",
    entity: "Task",
    entityId: parsed.data.id,
  });
  revalidateDashboard();
  return { ok: true };
}

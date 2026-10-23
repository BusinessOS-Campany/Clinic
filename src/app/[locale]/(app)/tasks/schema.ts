import { z } from "zod";

export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;

export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  priority: z.enum(TASK_PRIORITIES).default("NORMAL"),
  dueDate: z.string().trim().min(1).nullish(),
});

export const taskUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().trim().nullish(),
});

export const taskIdSchema = z.object({ id: z.string().min(1) });

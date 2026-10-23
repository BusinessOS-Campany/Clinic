"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  Check,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTask,
  deleteTask,
  toggleTask,
  updateTask,
} from "@/app/[locale]/(app)/tasks/actions";

export type TaskItem = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  dueDate: string | null;
  completedAt: string | null;
};

const PRIORITY_STYLE: Record<TaskItem["priority"], string> = {
  LOW: "bg-muted text-muted-foreground",
  NORMAL: "bg-primary/10 text-primary",
  HIGH: "bg-warning/15 text-warning",
  URGENT: "bg-destructive/15 text-destructive",
};

export function TasksWidget({ initialTasks }: { initialTasks: TaskItem[] }) {
  const t = useTranslations("tasks");
  const locale = useLocale();
  const [items, setItems] = useState<TaskItem[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskItem["priority"]>("NORMAL");
  const [due, setDue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const total = items.length;
  const done = items.filter((i) => i.status === "DONE").length;

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "short",
  });

  function add() {
    const value = title.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await createTask({
        title: value,
        priority,
        dueDate: due || null,
      });
      if (res.ok && res.task) {
        setItems((prev) => [res.task as TaskItem, ...prev]);
        setTitle("");
        setDue("");
        setPriority("NORMAL");
      }
    });
  }

  function toggle(id: string) {
    startTransition(async () => {
      const res = await toggleTask({ id });
      if (res.ok && res.task) {
        const updated = res.task as TaskItem;
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteTask({ id });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  function saveEdit(id: string) {
    const value = editTitle.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await updateTask({ id, title: value });
      if (res.ok && res.task) {
        const updated = res.task as TaskItem;
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
      setEditingId(null);
    });
  }

  return (
    <div
      className="flex flex-col rounded-xl border bg-card shadow-sm"
      aria-label={t("title")}
    >
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">{t("title")}</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {t("progress", { done, total })}
        </span>
      </div>

      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={t("placeholder")}
            className="h-9 flex-1"
            disabled={pending}
          />
          <Button
            type="button"
            size="icon"
            className="size-9 shrink-0"
            onClick={add}
            disabled={pending || !title.trim()}
            aria-label={t("add")}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskItem["priority"])}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label={t("priority")}
            disabled={pending}
          >
            {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((p) => (
              <option key={p} value={p}>
                {t(`priority_${p}`)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label={t("due")}
            disabled={pending}
          />
        </div>
      </div>

      <div className="flex-1">
        {total === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => {
              const isDone = item.status === "DONE";
              return (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    disabled={pending}
                    aria-label={isDone ? t("markUndone") : t("markDone")}
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isDone
                        ? "border-success bg-success text-success-foreground"
                        : "border-muted-foreground/40 hover:border-primary",
                    )}
                  >
                    {isDone && <Check className="size-3" />}
                  </button>

                  {editingId === item.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(item.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 flex-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="size-7"
                        onClick={() => saveEdit(item.id)}
                        aria-label={t("save")}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setEditingId(null)}
                        aria-label={t("cancel")}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={cn(
                            "truncate text-sm",
                            isDone && "text-muted-foreground line-through",
                          )}
                        >
                          {item.title}
                        </span>
                        {item.dueDate && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="size-3" aria-hidden />
                            {dateFmt.format(new Date(item.dueDate))}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          PRIORITY_STYLE[item.priority],
                        )}
                      >
                        {t(`priority_${item.priority}`)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditTitle(item.title);
                        }}
                        aria-label={t("edit")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.id)}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Check, ListTodo, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTask,
  deleteTask,
  toggleTask,
  updateTask,
  type TaskDTO,
} from "@/app/[locale]/(app)/tasks/actions";

type Priority = TaskDTO["priority"];
type Status = TaskDTO["status"];

const PRIORITIES: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUSES: Status[] = ["TODO", "IN_PROGRESS", "DONE"];
const STATUS_ORDER: Record<Status, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };

const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: "bg-muted text-muted-foreground",
  NORMAL: "bg-primary/10 text-primary",
  HIGH: "bg-warning/15 text-warning",
  URGENT: "bg-destructive/15 text-destructive",
};

const STATUS_STYLE: Record<Status, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  DONE: "bg-success/15 text-success",
};

export function TasksBoard({ initialTasks }: { initialTasks: TaskDTO[] }) {
  const t = useTranslations("tasks");
  const locale = useLocale();
  const [items, setItems] = useState<TaskDTO[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [due, setDue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("NORMAL");
  const [editDue, setEditDue] = useState("");
  const [pending, startTransition] = useTransition();

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const total = items.length;
  const done = items.filter((i) => i.status === "DONE").length;

  const visible = useMemo(() => {
    return items
      .filter((i) => statusFilter === "all" || i.status === statusFilter)
      .filter((i) => priorityFilter === "all" || i.priority === priorityFilter)
      .slice()
      .sort((a, b) => {
        const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (s !== 0) return s;
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return ad - bd;
      });
  }, [items, statusFilter, priorityFilter]);

  function add() {
    const value = title.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await createTask({ title: value, priority, dueDate: due || null });
      if (res.ok && res.task) {
        setItems((prev) => [res.task as TaskDTO, ...prev]);
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
        const updated = res.task as TaskDTO;
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

  function startEdit(item: TaskDTO) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditPriority(item.priority);
    setEditDue(item.dueDate ? item.dueDate.slice(0, 10) : "");
  }

  function saveEdit(id: string) {
    const value = editTitle.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await updateTask({
        id,
        title: value,
        priority: editPriority,
        dueDate: editDue || null,
      });
      if (res.ok && res.task) {
        const updated = res.task as TaskDTO;
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
      setEditingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={t("placeholder")}
            className="h-9 min-w-[12rem] flex-1"
            disabled={pending}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label={t("priority")}
            disabled={pending}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`priority_${p}`)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label={t("due")}
            disabled={pending}
          />
          <Button
            type="button"
            className="h-9"
            onClick={add}
            disabled={pending || !title.trim()}
          >
            <Plus className="size-4" />
            {t("add")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label={t("filterStatus")}
          >
            <option value="all">{t("filterAll")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status_${s}`)}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label={t("filterPriority")}
          >
            <option value="all">{t("filterAll")}</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`priority_${p}`)}
              </option>
            ))}
          </select>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ListTodo className="size-4" aria-hidden />
          {t("progress", { done, total })}
        </span>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        {visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {items.length === 0 ? t("empty") : t("noResults")}
          </p>
        ) : (
          <ul className="divide-y">
            {visible.map((item) => {
              const isDone = item.status === "DONE";
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
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
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(item.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 min-w-[10rem] flex-1"
                        autoFocus
                      />
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as Priority)}
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                        aria-label={t("priority")}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {t(`priority_${p}`)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editDue}
                        onChange={(e) => setEditDue(e.target.value)}
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                        aria-label={t("due")}
                      />
                      <Button
                        size="icon"
                        className="size-8"
                        onClick={() => saveEdit(item.id)}
                        aria-label={t("save")}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => setEditingId(null)}
                        aria-label={t("cancel")}
                      >
                        <X className="size-4" />
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
                          "shrink-0 rounded-full px-2 py-0.5 text-xs",
                          STATUS_STYLE[item.status],
                        )}
                      >
                        {t(`status_${item.status}`)}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs",
                          PRIORITY_STYLE[item.priority],
                        )}
                      >
                        {t(`priority_${item.priority}`)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
                        onClick={() => startEdit(item)}
                        aria-label={t("edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.id)}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="size-4" />
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

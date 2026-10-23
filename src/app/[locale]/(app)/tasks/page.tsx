import { ListTodo } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAnyPermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { TasksBoard } from "@/components/tasks/tasks-board";

export default async function TasksPage() {
  const user = await requireAnyPermission([
    "patients:write",
    "reception:write",
    "encounters:write",
  ]);
  const t = await getTranslations("tasks");
  const clinicId = user.currentClinicId ?? "";

  const rows = await prisma.task.findMany({
    where: { clinicId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      completedAt: true,
    },
  });

  const tasks = rows.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("pageTitle")} description={t("pageSubtitle")} icon={ListTodo} />
      <TasksBoard initialTasks={tasks} />
    </div>
  );
}

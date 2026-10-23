import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AuditPage() {
  const user = await requirePermission("audit:read");
  const t = await getTranslations("common");
  const clinicId = user.currentClinicId;

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    where: clinicId ? { clinicId } : {},
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("audit")}
        icon={ShieldCheck}
        description="Immutable record of who did what, and when"
      />
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Record ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {log.createdAt.toISOString()}
                  </TableCell>
                  <TableCell>
                    {log.actor?.name ?? <span className="text-muted-foreground">system</span>}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.entityId ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
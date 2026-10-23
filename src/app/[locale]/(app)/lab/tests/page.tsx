import { FlaskConical } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AddTestForm } from "@/components/lab/add-test-form";
import { ListShell, ListGridRow } from "@/components/data/list-shell";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

export default async function LabTestsPage() {
  const user = await requirePermission("laboratory:read");
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";
  const canEdit = await can(user, "laboratory:verify");

  const tests = await prisma.labTest.findMany({
    where: { clinicId, isActive: true },
    orderBy: { code: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("tests")}
        icon={FlaskConical}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/lab">{t("requests")}</Link>
          </Button>
        }
      />

      <ListShell
        columns={[
          { label: t("code"), className: "min-w-[6ch] flex-1" },
          { label: t("nameAr"), className: "min-w-40 flex-1" },
          { label: t("nameEn"), className: "min-w-40 flex-1" },
          { label: t("unit"), className: "shrink-0" },
          { label: t("price"), className: "shrink-0 text-right" },
          { label: t("referenceRange"), className: "shrink-0" },
        ]}
      >
        {tests.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noTests")} description={t("noTestsDesc")} />
        ) : (
          tests.map((test, i) => (
            <ListGridRow key={test.id} index={i}>
              <span className="font-mono truncate">{test.code}</span>
              <span className="truncate">{test.nameAr}</span>
              <span className="truncate">{test.nameEn}</span>
              <span className="shrink-0 text-muted-foreground">{test.unit ?? "—"}</span>
              <span className="shrink-0 text-right dir-ltr font-medium">{fmtMoney(Number(test.price))}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{test.referenceRange ?? "—"}</span>
            </ListGridRow>
          ))
        )}
      </ListShell>

      {canEdit && <AddTestForm />}
    </div>
  );
}
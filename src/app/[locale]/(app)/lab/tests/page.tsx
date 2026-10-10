import { FlaskConical } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LabCatalog } from "@/components/lab/lab-catalog";

export default async function LabTestsPage() {
  const user = await requirePermission("laboratory:read");
  const t = await getTranslations("lab");
  const clinicId = user.currentClinicId ?? "";
  const canEdit = await can(user, "laboratory:verify");

  const [categories, tests] = await Promise.all([
    prisma.labTestCategory.findMany({
      where: { clinicId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    }),
    prisma.labTest.findMany({
      where: { clinicId, isActive: true },
      orderBy: { code: "asc" },
      include: { referenceRanges: true },
    }),
  ]);

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

      {canEdit ? (
        <LabCatalog
          categories={categories.map((c) => ({ id: c.id, code: c.code, nameAr: c.nameAr, nameEn: c.nameEn }))}
          tests={tests.map((test) => ({
            id: test.id,
            code: test.code,
            nameAr: test.nameAr,
            nameEn: test.nameEn,
            categoryId: test.categoryId,
            unit: test.unit,
            referenceRange: test.referenceRange,
            method: test.method,
            specimenType: test.specimenType,
            collectionInstructions: test.collectionInstructions,
            turnaroundHours: test.turnaroundHours,
            price: Number(test.price),
            ranges: test.referenceRanges.map((r) => ({
              sex: r.sex,
              ageMinYears: r.ageMinYears?.toString() ?? "",
              ageMaxYears: r.ageMaxYears?.toString() ?? "",
              low: r.low?.toString() ?? "",
              high: r.high?.toString() ?? "",
              criticalLow: r.criticalLow?.toString() ?? "",
              criticalHigh: r.criticalHigh?.toString() ?? "",
              text: r.text ?? "",
            })),
          }))}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {tests.map((test) => (
            <div key={test.id} className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 sm:grid-cols-[90px_1fr_1fr_100px] sm:items-center sm:gap-3">
              <span className="font-mono">{test.code}</span>
              <span>{test.nameAr}</span>
              <span>{test.nameEn}</span>
              <span className="text-muted-foreground">{test.unit ?? "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

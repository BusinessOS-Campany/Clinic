import { Boxes, Plus, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ low?: string }>;
}) {
  const user = await requirePermission("inventory:read");
  const { low } = await searchParams;
  const t = await getTranslations("inventory");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "inventory:write");

  const lowOnly = low === "1";
  const items = await prisma.inventoryItem.findMany({
    where: { clinicId, isActive: true, ...(lowOnly ? { currentQty: { lte: 0 } } : {}) },
    orderBy: [{ currentQty: "asc" }, { code: "asc" }],
    take: 200,
  });

  const lowCount = await prisma.inventoryItem.count({
    where: { clinicId, isActive: true, currentQty: { lte: 0 } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={Boxes}
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/inventory/new">
                <Plus />
                {t("newItem")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={!lowOnly ? "default" : "outline"} size="sm">
          <Link href="/inventory">{t("items")}: All</Link>
        </Button>
        <Button asChild variant={lowOnly ? "default" : "outline"} size="sm">
          <Link href="/inventory?low=1">
            <TriangleAlert />
            {t("lowStock")} {lowCount > 0 ? `(${lowCount})` : ""}
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noItems")}</p>}
        <div className="hidden grid-cols-[90px_1fr_1fr_100px_100px_40px_90px] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("code")}</span>
          <span>{t("nameEn")}</span>
          <span>{t("category")}</span>
          <span>{t("onHand")}</span>
          <span>{t("price")}</span>
          <span />
          <span />
        </div>
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/inventory/${item.id}`}
            className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/50 sm:grid-cols-[90px_1fr_1fr_100px_100px_40px_90px] sm:items-center sm:gap-3"
          >
            <span className="font-mono">{item.code}</span>
            <span className="font-medium">{item.nameEn || item.nameAr}</span>
            <span className="text-muted-foreground">{item.category ?? "—"}</span>
            <span>
              {item.currentQty} {item.unit}
              {item.currentQty <= 0 && (
                <Badge variant="destructive" className="ms-1">{t("lowStock")}</Badge>
              )}
            </span>
            <span dir="ltr">{fmtMoney(Number(item.price))}</span>
            <span />
            <span className="text-muted-foreground">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
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
import { FilterBar, FilterPill } from "@/components/data/filter-bar";
import { ListShell, ListGridRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

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
        description={`${items.length} ${t("items")}`}
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

      <FilterBar>
        <FilterPill href="/inventory" active={!lowOnly} count={items.length}>
          {t("items")}: All
        </FilterPill>
        <FilterPill href="/inventory?low=1" active={lowOnly} count={lowCount}>
          <TriangleAlert className="size-3" aria-hidden />
          {t("lowStock")}
        </FilterPill>
      </FilterBar>

      <ListShell
        columns={[
          { label: t("code"), className: "min-w-[6ch] flex-1" },
          { label: t("nameEn"), className: "min-w-40 flex-1" },
          { label: t("category"), className: "shrink-0" },
          { label: t("onHand"), className: "shrink-0 text-right" },
          { label: t("price"), className: "shrink-0 text-right" },
          { label: "", className: "shrink-0 text-right" },
        ]}
      >
        {items.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noItems")} description={t("noItemsDesc")} />
        ) : (
          items.map((item, i) => (
            <ListGridRow key={item.id} href={`/inventory/${item.id}`} index={i}>
              <span className="font-mono truncate">{item.code}</span>
              <span className="font-medium truncate">{item.nameEn || item.nameAr}</span>
              <span className="shrink-0 text-muted-foreground">{item.category ?? "—"}</span>
              <span className="shrink-0 text-right font-medium tabular-nums">
                {item.currentQty} {item.unit}
                {item.currentQty <= 0 && (
                  <Badge variant="destructive" className="ms-1">{t("lowStock")}</Badge>
                )}
              </span>
              <span className="shrink-0 text-right dir-ltr font-medium">{fmtMoney(Number(item.price))}</span>
              <span className="shrink-0 text-right text-muted-foreground">→</span>
            </ListGridRow>
          ))
        )}
      </ListShell>
    </div>
  );
}
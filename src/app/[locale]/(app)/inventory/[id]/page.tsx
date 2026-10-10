import { Boxes, TriangleAlert } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { fmtDate, fmtMoney } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MovementForm } from "@/components/inventory/movement-form";

const MOVEMENT_BADGE: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
  PURCHASE: "success",
  DISPENSE: "info",
  ADJUST: "warning",
  RETURN: "secondary",
  DAMAGE: "destructive",
};

export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("inventory:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("inventory");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "inventory:write");

  const item = await prisma.inventoryItem.findFirst({
    where: { id, clinicId },
    include: { movements: { orderBy: { movedAt: "desc" }, take: 100 } },
  });
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${item.code} — ${locale === "ar" ? item.nameAr : item.nameEn || item.nameAr}`}
        icon={Boxes}
        description={`${item.category ?? "—"} · ${item.supplier ?? "—"}`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("onHand")}</span>
            <span className="text-lg font-semibold">
              {item.currentQty} {item.unit}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("reorderLevel")}</span>
            <span className="text-lg font-semibold">{item.reorderLevel}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("price")}</span>
            <span dir="ltr" className="text-lg font-semibold">{fmtMoney(Number(item.price))}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("expiry")}</span>
            <span className="text-lg font-semibold">
              {item.expiryDate ? fmtDate(item.expiryDate) : "—"}
              {item.currentQty <= 0 && (
                <Badge variant="destructive" className="ms-1"><TriangleAlert />{t("lowStock")}</Badge>
              )}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="text-sm font-semibold">{t("movements")}</h2>
          {item.movements.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {item.movements.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <Badge variant={MOVEMENT_BADGE[m.type] ?? "secondary"}>{t(`type_${m.type}`)}</Badge>
                <span dir="ltr" className={m.quantity < 0 ? "text-destructive" : "text-emerald-600"}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity}
                </span>
                {m.reference && <span className="font-mono text-xs text-muted-foreground">{m.reference}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {m.notes && <span>{m.notes}</span>}
                <span>{fmtDate(m.movedAt)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {canWrite && <MovementForm itemId={item.id} />}
    </div>
  );
}
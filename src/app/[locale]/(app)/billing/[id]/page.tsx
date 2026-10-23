import { getLocale, getTranslations } from "next-intl/server";
import { Banknote, Receipt, Printer } from "lucide-react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceActions } from "@/components/billing/invoice-actions";
import { RefundPaymentButton } from "@/components/billing/refund-payment-button";
import { DeleteItemButton } from "@/components/billing/delete-item-button";

const STATUS_BADGE: Record<string, "outline" | "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "outline",
  OPEN: "warning",
  PAID: "success",
  VOID: "destructive",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("billing:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("billing");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "billing:write");

  const invoice = await prisma.invoice.findFirst({
    where: { id, clinicId },
    include: {
      patient: {
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      },
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!invoice) notFound();

  const total = Number(invoice.total);
  const balance = total - Number(invoice.paidAmount);
  const editable = canWrite && invoice.status !== "VOID";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${t("invoice")} ${invoice.invoiceNo}`}
        icon={Receipt}
        description={displayName(invoice.patient, locale)}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/billing/${id}/receipt`} target="_blank">
              <Printer />
              {t("printReceipt")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("status")}</span>
            <Badge variant={STATUS_BADGE[invoice.status] ?? "secondary"} className="w-fit">
              {t(`status_${invoice.status}`)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("subtotal")}</span>
            <span dir="ltr" className="text-lg font-semibold">{fmtMoney(Number(invoice.subtotal))}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("total")}</span>
            <span dir="ltr" className="text-lg font-semibold">{fmtMoney(total)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-xs text-muted-foreground">{t("balance")}</span>
            <span dir="ltr" className="text-lg font-semibold">{fmtMoney(balance)}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="text-sm font-semibold">{t("items")}</h2>
          <div className="hidden grid-cols-[1fr_3fr_80px_110px_110px_auto] gap-3 px-1 text-xs text-muted-foreground sm:grid">
            <span>{t("kind")}</span>
            <span>{t("description")}</span>
            <span>{t("qty")}</span>
            <span>{t("unitPrice")}</span>
            <span>{t("lineTotal")}</span>
            <span />
          </div>
          {invoice.items.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {invoice.items.map((it) => (
            <div
              key={it.id}
              className="grid grid-cols-2 gap-2 rounded-lg border px-2 py-2 text-sm sm:grid-cols-[1fr_3fr_80px_110px_110px_auto] sm:items-center sm:gap-3"
            >
              <span><Badge variant="outline">{t(`kind_${it.kind}`)}</Badge></span>
              <span className="font-medium">{it.description}</span>
              <span>{Number(it.quantity)}</span>
              <span dir="ltr">{Number(it.unitPrice)}</span>
              <span dir="ltr">{fmtMoney(Number(it.total))}</span>
              {editable && <DeleteItemButton itemId={it.id} />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <h2 className="text-sm font-semibold">{t("payment")}</h2>
          {invoice.payments.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          {invoice.payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-muted-foreground" />
                <Badge variant="outline">{t(`paymentMethod_${p.method}`)}</Badge>
                {p.reference && (
                  <span className="font-mono text-xs text-muted-foreground">{p.reference}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span dir="ltr" className="font-semibold">{fmtMoney(Number(p.amount))}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(p.paidAt)} {fmtTime(p.paidAt)}
                </span>
                {editable && <RefundPaymentButton paymentId={p.id} />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {editable && (
        <Card>
          <CardContent className="pt-6">
            <InvoiceActions invoiceId={invoice.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
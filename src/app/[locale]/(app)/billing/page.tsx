import { Receipt, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtMoney } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_BADGE: Record<string, "outline" | "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "outline",
  OPEN: "warning",
  PAID: "success",
  VOID: "destructive",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission("billing:read");
  const { status } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("billing");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "billing:write");

  const filter = status === "OPEN" || status === "PAID" || status === "VOID" || status === "DRAFT" ? status : undefined;

  const invoices = await prisma.invoice.findMany({
    where: { clinicId, ...(filter ? { status: filter } : {}) },
    include: {
      patient: {
        select: {
          id: true,
          mrn: true,
          firstNameAr: true,
          secondNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={Receipt}
        actions={
          canWrite ? (
            <Button asChild>
              <Link href="/billing/new">
                <Plus />
                {t("newInvoice")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-2">
        <Button asChild variant={filter ? "outline" : "default"} size="sm">
          <Link href="/billing">{t("status")}: All</Link>
        </Button>
        {(["DRAFT", "OPEN", "PAID", "VOID"] as const).map((s) => (
          <Button asChild key={s} variant={filter === s ? "default" : "outline"} size="sm">
            <Link href={`/billing?status=${s}`}>{t(`status_${s}`)}</Link>
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {invoices.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noInvoices")}</p>}
        <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-3 border-b px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>{t("invoiceNo")}</span>
          <span>{t("patient")}</span>
          <span>{t("issued")}</span>
          <span>{t("total")}</span>
          <span>{t("balance")}</span>
          <span>{t("status")}</span>
        </div>
        {invoices.map((inv) => {
          const balance = Number(inv.total) - Number(inv.paidAmount);
          return (
            <Link
              key={inv.id}
              href={`/billing/${inv.id}`}
              className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-accent/50 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-3"
            >
              <span className="font-mono font-medium">{inv.invoiceNo}</span>
              <span>
                {displayName(inv.patient, locale)}
                <span className="ms-2 font-mono text-xs text-muted-foreground">{inv.patient.mrn}</span>
              </span>
              <span className="text-muted-foreground">{fmtDate(inv.createdAt)}</span>
              <span dir="ltr">{fmtMoney(Number(inv.total))}</span>
              <span dir="ltr">{fmtMoney(balance)}</span>
              <Badge variant={STATUS_BADGE[inv.status] ?? "secondary"}>
                {t(`status_${inv.status}`)}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
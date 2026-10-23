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
import { FilterBar, FilterPill } from "@/components/data/filter-bar";
import { ListShell, ListGridRow } from "@/components/data/list-shell";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

type StatusFilter = "DRAFT" | "OPEN" | "PAID" | "VOID";

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

      <FilterBar>
        <FilterPill href="/billing" active={!filter} count={invoices.length}>
          {t("status")}: All
        </FilterPill>
        {(["DRAFT", "OPEN", "PAID", "VOID"] as const).map((s) => (
          <FilterPill key={s} href={`/billing?status=${s}`} active={filter === s}>
            {t(`status_${s}`)}
          </FilterPill>
        ))}
      </FilterBar>

      <ListShell
        columns={[
          { label: t("invoiceNo"), className: "min-w-[10ch] flex-1" },
          { label: t("patient"), className: "min-w-40 flex-1" },
          { label: t("issued"), className: "shrink-0" },
          { label: t("total"), className: "shrink-0 text-right" },
          { label: t("balance"), className: "shrink-0 text-right" },
          { label: t("status"), className: "shrink-0 text-right" },
        ]}
      >
        {invoices.length === 0 ? (
          <EmptyState icon={Inbox} title={t("noInvoices")} description={t("noInvoicesDesc")} />
        ) : (
          invoices.map((inv, i) => {
            const balance = Number(inv.total) - Number(inv.paidAmount);
            return (
              <ListGridRow key={inv.id} href={`/billing/${inv.id}`} index={i}>
                <span className="font-mono font-medium truncate">{inv.invoiceNo}</span>
                <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                  {displayName(inv.patient, locale)}
                  <span className="ms-2 font-mono text-xs text-muted-foreground">{inv.patient.mrn}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">{fmtDate(inv.createdAt)}</span>
                <span className="shrink-0 text-right dir-ltr font-medium">{fmtMoney(Number(inv.total))}</span>
                <span className="shrink-0 text-right dir-ltr font-medium">{fmtMoney(balance)}</span>
                <span className="shrink-0 text-right">
                  <StatusBadge status={inv.status}>{t(`status_${inv.status}`)}</StatusBadge>
                </span>
              </ListGridRow>
            );
          })
        )}
      </ListShell>
    </div>
  );
}
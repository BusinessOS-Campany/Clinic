import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { fmtDate, fmtMoney } from "@/lib/format";
import { PrintButton } from "@/components/encounters/print-button";

export default async function InvoiceReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("billing:read");
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("billing");
  const clinicId = user.currentClinicId ?? "";

  const invoice = await prisma.invoice.findFirst({
    where: { id, clinicId },
    include: {
      patient: {
        select: {
          mrn: true,
          firstNameAr: true,
          lastNameAr: true,
          firstNameEn: true,
          lastNameEn: true,
        },
      },
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!invoice) notFound();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { nameAr: true, nameEn: true, phone: true, email: true },
  });

  const total = Number(invoice.total);
  const paid = Number(invoice.paidAmount);
  const balance = total - paid;

  return (
    <main className="mx-auto max-w-[760px] p-6">
      <div className="mb-8 flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-lg font-bold">{locale === "ar" ? clinic?.nameAr : clinic?.nameEn}</p>
          {clinic?.phone ? <p className="text-xs text-muted-foreground">{clinic.phone}</p> : null}
          {clinic?.email ? <p className="text-xs text-muted-foreground">{clinic.email}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold uppercase tracking-wide">
            {invoice.status === "PAID" ? t("receipt") : t("invoice")}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {t("invoiceNo")}: {invoice.invoiceNo}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {t("issued")}: {fmtDate(invoice.createdAt, locale)}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 text-sm">
        <p>
          {t("patient")}: <span className="font-medium">{displayName(invoice.patient, locale)}</span>
        </p>
        <p>
          <span className="font-mono text-xs text-muted-foreground">{invoice.patient.mrn}</span>
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
            <th className="pb-2">{t("description")}</th>
            <th className="pb-2 text-right">{t("qty")}</th>
            <th className="pb-2 text-right">{t("unitPrice")}</th>
            <th className="pb-2 text-right">{t("lineTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it) => (
            <tr key={it.id} className="border-b border-dashed">
              <td className="py-2">
                <span className="text-xs text-muted-foreground">{t(`kind_${it.kind}`)}</span>
                <span className="block">{it.description}</span>
              </td>
              <td className="py-2 text-right tabular-nums">{Number(it.quantity)}</td>
              <td className="py-2 text-right tabular-nums" dir="ltr">{fmtMoney(Number(it.unitPrice))}</td>
              <td className="py-2 text-right tabular-nums" dir="ltr">{fmtMoney(Number(it.total))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ms-auto w-56 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span dir="ltr">{fmtMoney(Number(invoice.subtotal))}</span>
        </div>
        {Number(invoice.discount) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("discount")}</span>
            <span dir="ltr">-{fmtMoney(Number(invoice.discount))}</span>
          </div>
        )}
        {Number(invoice.taxRate) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("taxRate")}</span>
            <span dir="ltr">{Number(invoice.taxRate)}%</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1 text-base font-bold">
          <span>{t("total")}</span>
          <span dir="ltr">{fmtMoney(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("paid")}</span>
          <span dir="ltr">{fmtMoney(paid)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>{t("balance")}</span>
          <span dir="ltr">{fmtMoney(balance)}</span>
        </div>
      </div>

      {invoice.payments.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">{t("payment")}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{t(`paymentMethod_${p.method}`)}</span>
                {p.reference ? <span className="font-mono text-xs text-muted-foreground">{p.reference}</span> : null}
                <span className="ms-auto tabular-nums" dir="ltr">{fmtMoney(Number(p.amount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {invoice.notes ? (
        <p className="mt-6 whitespace-pre-wrap text-xs text-muted-foreground">{invoice.notes}</p>
      ) : null}

      <div className="mt-10">
        <PrintButton ns="billing" labelKey="print" />
      </div>
    </main>
  );
}
import { Receipt } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { loadInvoices } from "@/lib/patient-profile/queries";
import { fmtDate, fmtMoney, toNumber } from "@/lib/format";
import type { BadgeVariant } from "@/components/patients/profile/profile-records";
import {
  ProfileEmpty,
  ProfileRecordList,
  type ProfileRecord,
} from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadInvoices>>[number];

const STATUS_BADGE: Record<string, BadgeVariant> = {
  DRAFT: "outline",
  OPEN: "warning",
  PAID: "success",
  VOID: "destructive",
};

export async function BillingTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");
  const tb = await getTranslations("billing");

  if (items.length === 0) {
    return <ProfileEmpty icon={Receipt} title={tb("noInvoices")} />;
  }

  const total = items.reduce((sum, item) => sum + toNumber(item.total), 0);
  const paid = items.reduce((sum, item) => sum + toNumber(item.paidAmount), 0);

  const records: ProfileRecord[] = items.map((item) => ({
    id: item.id,
    title: item.invoiceNo,
    subtitle: fmtDate(item.createdAt, locale),
    badges: [
      {
        label: tb(`status_${item.status}`),
        variant: STATUS_BADGE[item.status] ?? "secondary",
      },
    ],
    facts: [
      { label: tb("total"), value: fmtMoney(item.total) },
      { label: tb("paid"), value: fmtMoney(item.paidAmount) },
      {
        label: tb("balance"),
        value: fmtMoney(toNumber(item.total) - toNumber(item.paidAmount)),
      },
      ...(item.payments.length > 0
        ? [
            {
              label: tb("payment"),
              value: item.payments
                .map(
                  (payment) =>
                    `${tb(`paymentMethod_${payment.method}`)} · ${fmtMoney(
                      payment.amount,
                    )} · ${fmtDate(payment.paidAt, locale)}`,
                )
                .join("\n"),
            },
          ]
        : []),
    ],
    note: item.notes,
    trailing: (
      <Link
        href={`/billing/${item.id}`}
        className="text-xs text-primary underline-offset-4 hover:underline"
      >
        {tb("invoice")}
      </Link>
    ),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: tb("total"), value: fmtMoney(total) },
          { label: tb("paid"), value: fmtMoney(paid) },
          {
            label: tb("balance"),
            value: fmtMoney(total - paid),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-xl border bg-card p-4"
          >
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-lg font-semibold tabular-nums">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      <ProfileRecordList records={records} />
    </div>
  );
}
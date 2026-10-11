import { GitMerge } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProfileEmpty } from "@/components/patients/profile/profile-records";

const STATUS_VARIANT = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  APPLIED: "success",
} as const;

type MergeItem = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "APPLIED";
  reason: string;
  createdAt: Date;
  requestedBy: { name: string } | null;
  approvedBy: { name: string } | null;
  primary: { id: string; mrn: string };
  decidedAt: Date | null;
};

export async function MergesTab({
  items,
  locale,
  canMerge,
  isRequester,
  primaryMrn,
}: {
  items: MergeItem[];
  locale: string;
  canMerge: boolean;
  isRequester: boolean;
  primaryMrn: string;
}) {
  const t = await getTranslations("patients");

  if (items.length === 0) {
    return <ProfileEmpty icon={GitMerge} title={t("noMergeRequests")} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-start font-medium">{t("createdOn")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("status")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("mergeReason")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("mergePrimaryLabel")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("requestedBy")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2 text-start">
                {fmtDate(item.createdAt, locale)}
              </td>
              <td className="px-3 py-2 text-start">
                <Badge variant={STATUS_VARIANT[item.status]}>
                  {t(`mergeStatus_${item.status}`)}
                </Badge>
              </td>
              <td className="px-3 py-2 text-start">{item.reason}</td>
              <td className="px-3 py-2 text-start font-mono">
                {item.primary.mrn}
              </td>
              <td className="px-3 py-2 text-start text-muted-foreground">
                {item.requestedBy?.name ?? "—"}
              </td>
              <td className="px-3 py-2 text-start">
                {item.status === "PENDING" && canMerge ? (
                  <span className="text-xs text-muted-foreground">
                    {t("mergeAwaitingApproval")}
                  </span>
                ) : item.status === "APPROVED" && canMerge ? (
                  <span className="text-xs text-primary font-medium">
                    {t("readyToApply", { primary: primaryMrn })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{item.status}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
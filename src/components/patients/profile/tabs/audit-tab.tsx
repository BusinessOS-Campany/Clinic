import { ScrollText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadPatientAudit } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProfileEmpty } from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadPatientAudit>>[number];

const ACTION_BADGE: Record<string, "secondary" | "success" | "warning" | "destructive" | "info"> = {
  create: "success",
  update: "info",
  delete: "destructive",
  sign: "success",
  read: "secondary",
  export: "warning",
};

export async function AuditTab({
  items,
  locale,
  canRead,
}: {
  items: Item[];
  locale: string;
  canRead: boolean;
}) {
  const t = await getTranslations("patients");

  if (!canRead) {
    return <ProfileEmpty icon={ScrollText} title={t("auditForbidden")} />;
  }

  if (items.length === 0) {
    return <ProfileEmpty icon={ScrollText} title={t("noAudit")} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-start font-medium">{t("recordedOn")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("action")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("entity")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("user")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("ipAddress")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2 text-start">
                {fmtDate(item.createdAt, locale)}
              </td>
              <td className="px-3 py-2 text-start">
                <Badge variant={ACTION_BADGE[item.action] ?? "secondary"}>
                  {item.action}
                </Badge>
              </td>
              <td className="px-3 py-2 text-start">{item.entity}</td>
              <td className="px-3 py-2 text-start text-muted-foreground">
                {item.actor?.name ?? "—"}
              </td>
              <td
                className="whitespace-nowrap px-3 py-2 text-start tabular-nums text-muted-foreground"
                dir="ltr"
              >
                {item.ipAddress ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
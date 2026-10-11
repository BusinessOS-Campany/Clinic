import { HeartPulse } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadVitals } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProfileEmpty } from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadVitals>>[number];

function bmiTone(bmi: number | null): string {
  if (bmi === null) return "";
  if (bmi < 18.5) return "text-warning";
  if (bmi >= 25) return "text-destructive";
  return "text-success";
}

export async function VitalsTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");
  const te = await getTranslations("encounters");
  const tv = await getTranslations("vitals");

  if (items.length === 0) {
    return <ProfileEmpty icon={HeartPulse} title={t("noVitals")} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-start font-medium">{t("recordedOn")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("temperature")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("pulse")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("respRate")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("bp")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("spO2")}</th>
            <th className="px-3 py-2 text-start font-medium">{tv("painScore")}</th>
            <th className="px-3 py-2 text-start font-medium">{tv("consciousness")}</th>
            <th className="px-3 py-2 text-start font-medium">{tv("glucose")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("height")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("weight")}</th>
            <th className="px-3 py-2 text-start font-medium">{te("bmi")}</th>
            <th className="px-3 py-2 text-start font-medium">{tv("recordedBy")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2 text-start">
                <div>{fmtDate(item.createdAt, locale)}</div>
                <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                  {tv(`source_${item.source}`)}
                </Badge>
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.temperature !== null ? `${item.temperature} °C` : "—"}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.pulse ?? "—"}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.respRate ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-start tabular-nums">
                {item.bpSystolic ?? "—"}
                {item.bpDiastolic !== null && item.bpDiastolic !== undefined
                  ? `/${item.bpDiastolic}`
                  : ""}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.spO2 !== null ? `${item.spO2}%` : "—"}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.painScore !== null ? `${item.painScore}/10` : "—"}
              </td>
              <td className="px-3 py-2 text-start">
                {item.consciousness
                  ? tv(`consciousness_${item.consciousness}`)
                  : "—"}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.glucose !== null ? `${item.glucose} ${tv("unitGlucose")}` : "—"}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.heightCm !== null ? `${item.heightCm} cm` : "—"}
              </td>
              <td className="px-3 py-2 text-start tabular-nums">
                {item.weightKg !== null ? `${item.weightKg} kg` : "—"}
              </td>
              <td
                className={`px-3 py-2 text-start font-medium tabular-nums ${bmiTone(item.bmi)}`}
              >
                {item.bmi ?? "—"}
              </td>
              <td className="px-3 py-2 text-start text-muted-foreground">
                {item.doctor?.name ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
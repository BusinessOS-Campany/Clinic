import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { loadClinicalNotes } from "@/lib/patient-profile/queries";
import { fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProfileEmpty } from "@/components/patients/profile/profile-records";

type Item = Awaited<ReturnType<typeof loadClinicalNotes>>[number];

const SECTIONS = [
  { key: "subjective", label: "subjective" },
  { key: "objective", label: "objective" },
  { key: "assessment", label: "assessment" },
  { key: "plan", label: "plan" },
] as const;

export async function NotesTab({
  items,
  locale,
}: {
  items: Item[];
  locale: string;
}) {
  const t = await getTranslations("patients");
  const te = await getTranslations("encounters");

  if (items.length === 0) {
    return <ProfileEmpty icon={FileText} title={t("noNotes")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {fmtDate(item.createdAt, locale)}
              </span>
              {item.doctor && (
                <span className="text-xs text-muted-foreground">
                  {item.doctor.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={item.status === "COMPLETED" ? "success" : "warning"}
              >
                {item.status === "COMPLETED" ? t("completed") : t("inProgress")}
              </Badge>
            </div>
          </header>
          <div className="flex flex-col gap-3 px-4 py-3">
            {item.chiefComplaint && (
              <p className="text-sm font-medium">{item.chiefComplaint}</p>
            )}
            {SECTIONS.map((section) => {
              const value = item[section.key];
              if (!value) return null;
              return (
                <div key={section.key} className="grid gap-1 sm:grid-cols-[110px_1fr]">
                  <span className="text-xs font-medium text-muted-foreground">
                    {te(section.label)}
                  </span>
                  <p className="whitespace-pre-wrap text-sm">{value}</p>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
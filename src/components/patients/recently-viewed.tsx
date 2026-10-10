import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { displayName, initials } from "@/lib/patient";
import type { Patient as PatientRow } from "@/lib/generated/prisma/client";

type Patient = Pick<
  PatientRow,
  | "id"
  | "mrn"
  | "patientId"
  | "firstNameAr"
  | "secondNameAr"
  | "lastNameAr"
  | "firstNameEn"
  | "lastNameEn"
>;

export async function RecentlyViewed({
  patients,
  locale,
}: {
  patients: Patient[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">
        {t("recentlyViewed")}
      </p>
      <div className="flex flex-wrap gap-2">
        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/patients/${p.id}`}
            className="flex items-center gap-2 rounded-full border bg-card py-1 ps-1 pe-3 text-sm transition hover:bg-accent"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(p)}
            </span>
            <span className="font-medium">{displayName(p, locale)}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {p.mrn}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { calcAge, formatDate } from "@/lib/patient";
import { fmtMoney } from "@/lib/format";

export type PatientInfoData = {
  gender: string;
  birthDate: Date | null;
  phone: string | null;
  phone2: string | null;
  city: string | null;
  price: { toNumber(): number } | number | null;
  notes: string | null;
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export async function PatientInfoCard({
  patient,
  locale,
}: {
  patient: PatientInfoData;
  locale: string;
}) {
  const t = await getTranslations("patients");
  const age = calcAge(patient.birthDate);

  return (
    <Card>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <Fact
          label={t("gender")}
          value={patient.gender === "FEMALE" ? t("female") : t("male")}
        />
        <Fact
          label={t("dateOfBirth")}
          value={
            patient.birthDate
              ? `${formatDate(patient.birthDate, locale)}${
                  age === null ? "" : ` · ${age} ${t("age")}`
                }`
              : undefined
          }
        />
        <Fact label={t("phone")} value={patient.phone} />
        <Fact label={t("phone2")} value={patient.phone2} />
        <Fact
          label={t("city")}
          value={patient.city ? t(`city_${patient.city}`) : undefined}
        />
        <Fact label={t("price")} value={fmtMoney(patient.price)} />
        <div className="sm:col-span-2 lg:col-span-4">
          <Fact label={t("notes")} value={patient.notes} />
        </div>
      </CardContent>
    </Card>
  );
}
import { BadgeCheck, Fingerprint } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { calcAge } from "@/lib/patient";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function PatientSummaryHeader({
  patientName,
  mrn,
  photo,
  birthDate,
  bloodType,
  insuranceCompany,
  insurancePolicyNumber,
}: {
  patientName: string;
  mrn: string;
  photo: string | null;
  birthDate: Date | null;
  bloodType: string | null;
  insuranceCompany: string | null;
  insurancePolicyNumber: string | null;
}) {
  const t = await getTranslations("patients");
  const age = calcAge(birthDate);

  const title = (icon: React.ReactNode, label: string) => (
    <CardTitle className="flex items-center gap-2 text-xs font-medium text-foreground/80">
      {icon}
      {label}
    </CardTitle>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardHeader className="p-4 pb-0">{title(<BadgeCheck className="size-4" />, t("summary"))}</CardHeader>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              {photo ? <AvatarImage src={photo} alt="" /> : null}
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                {patientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{patientName}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Fingerprint className="size-3" />
                {mrn}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {age !== null ? <Badge variant="secondary">{t("age")}: {age}</Badge> : null}
            {bloodType ? <Badge variant="outline">{bloodType}</Badge> : null}
            {insuranceCompany ? (
              <Badge variant="outline" className="border-success/30 text-success">
                {insuranceCompany}
                {insurancePolicyNumber ? ` · ${insurancePolicyNumber}` : ""}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
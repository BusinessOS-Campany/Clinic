import { ArrowRight, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientForm } from "@/components/patients/patient-form";

export default async function NewPatientPage() {
  await requirePermission("patients:write");
  const t = await getTranslations("patients");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("newPatient")}
        icon={Users}
        actions={
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/patients">
              <ArrowRight className="size-4 rtl:rotate-180" />
              {tc("back")}
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-2">
          <PatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
import { HeartPulse } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { displayName } from "@/lib/patient";
import { toNumber } from "@/lib/format";
import { loadNursingQueue, loadRosterAlerts } from "@/lib/vitals/queries";
import { PageHeader } from "@/components/layout/page-header";
import { NursingRoster } from "@/components/nursing/nursing-roster";
import {
  VitalAlertsPanel,
  type RosterAlert,
} from "@/components/nursing/vital-alerts-panel";

export default async function NursingPage() {
  const user = await requirePermission("encounters:read");
  const locale = await getLocale();
  const t = await getTranslations("vitals");
  const clinicId = user.currentClinicId ?? "";
  const canWrite = await can(user, "encounters:write");

  const entries = await loadNursingQueue(clinicId);
  const patientIds = entries.map((e) => e.patientId);
  const rawAlerts = await loadRosterAlerts(clinicId, patientIds);

  const nameByPatient = new Map(
    entries.map((e) => [
      e.patientId,
      displayName(
        {
          firstNameAr: e.firstNameAr,
          lastNameAr: e.lastNameAr,
          firstNameEn: e.firstNameEn,
          lastNameEn: e.lastNameEn,
        },
        locale,
      ),
    ]),
  );

  const alerts: RosterAlert[] = rawAlerts.map((a) => ({
    id: a.id,
    patientName: nameByPatient.get(a.patientId) ?? "",
    severity: a.severity,
    message: a.message,
    value: toNumber(a.value),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} icon={HeartPulse} description={t("subtitle")} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NursingRoster entries={entries} locale={locale} canWrite={canWrite} />
        </div>
        <VitalAlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}

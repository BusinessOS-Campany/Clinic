import { GitMerge } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { MergePatients } from "@/components/patients/merge-patients";

export default async function MergePatientsPage() {
  const user = await requirePermission("patients:read");
  const t = await getTranslations("patients");
  const canMerge = await can(user, "patients:merge");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("mergePatients")}
        description={t("mergeDescription")}
        icon={GitMerge}
      />
      <MergePatients canMerge={canMerge} />
    </div>
  );
}

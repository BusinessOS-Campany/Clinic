import { GitMerge } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MergeRequestForm } from "@/components/patients/merge-request-form";

export default async function NewMergeRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ primary?: string }>;
}) {
  await requirePermission("patients:merge");
  const { primary } = await searchParams;
  const t = await getTranslations("patients");
  const clinicId = (await requirePermission("patients:merge")).currentClinicId ?? "";

  if (!primary) notFound();

  const record = await prisma.patient.findFirst({
    where: { id: primary, clinicId, mergedIntoId: null },
    select: {
      id: true,
      mrn: true,
      firstNameAr: true,
      secondNameAr: true,
      lastNameAr: true,
      phone: true,
      nationalId: true,
    },
  });
  if (!record) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("merge")} icon={GitMerge} description={t("mergeRequestsDesc")} />
      <Card>
        <CardContent className="pt-6">
          <MergeRequestForm primary={record} />
        </CardContent>
      </Card>
    </div>
  );
}
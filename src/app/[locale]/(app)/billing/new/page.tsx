import { Receipt } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requirePermission } from "@/core/auth/session";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/patient";
import { PageHeader } from "@/components/layout/page-header";
import { NewInvoiceForm } from "@/components/billing/new-invoice-form";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const user = await requirePermission("billing:write");
  const t = await getTranslations("billing");
  const locale = await getLocale();
  const { patient } = await searchParams;
  const clinicId = user.currentClinicId ?? "";

  let initialPatient: { id: string; label: string } | undefined;
  if (patient) {
    const p = await prisma.patient.findFirst({ where: { id: patient, clinicId } });
    if (p) {
      initialPatient = { id: p.id, label: displayName(p, locale) };
    } else {
      notFound();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("newInvoice")} icon={Receipt} />
      <NewInvoiceForm initialPatient={initialPatient} />
    </div>
  );
}
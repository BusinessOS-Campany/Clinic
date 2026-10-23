import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { DrugCatalogPageContent } from "./drug-catalog-page-content";

export default async function DrugCatalogPage() {
  const user = await requirePermission("drug:read");
  const locale = await getLocale();
  const t = await getTranslations("drugs");
  const clinicId = user.currentClinicId ?? "";
  const canManage = await can(user, "drug:catalog");

  const drugs = await prisma.drugCatalog.findMany({
    where: { clinicId },
    orderBy: [{ genericName: "asc" }, { strength: "asc" }],
  });

  const interactions = await prisma.drugInteraction.findMany({
    where: { clinicId },
    include: {
      drug1: { select: { id: true, genericName: true, strength: true, dosageForm: true } },
      drug2: { select: { id: true, genericName: true, strength: true, dosageForm: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedDrugs = drugs.map((d) => ({
    ...d,
    maxDailyDose: d.maxDailyDose?.toString() ?? null,
    maxSingleDose: d.maxSingleDose?.toString() ?? null,
  }));

  return <DrugCatalogPageContent drugs={serializedDrugs} interactions={interactions} canManage={canManage} />;
}
import { Users, History, GitMerge } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/core/auth/session";
import { can } from "@/core/rbac";
import { prisma } from "@/lib/db";
import { patientSearchOr } from "@/lib/search";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { NewPatientButton } from "@/components/patients/new-patient-button";
import { PatientsToolbar } from "@/components/patients/patients-toolbar";
import { PatientsTable } from "@/components/patients/patients-table";
import { RecentlyViewed } from "@/components/patients/recently-viewed";

const PAGE_SIZE = 25;

type SearchParams = {
  q?: string;
  status?: string;
  gender?: string;
  city?: string;
  insurance?: string;
  from?: string;
  to?: string;
  page?: string;
};

function path(sp: SearchParams, page?: number) {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.status && sp.status !== "active") params.set("status", sp.status);
  if (sp.gender) params.set("gender", sp.gender);
  if (sp.city) params.set("city", sp.city);
  if (sp.insurance) params.set("insurance", sp.insurance);
  if (sp.from) params.set("from", sp.from);
  if (sp.to) params.set("to", sp.to);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/patients?${qs}` : "/patients";
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission("patients:read");
  const sp = await searchParams;
  const { q, status, gender, city, insurance, from, to, page } = sp;
  const locale = await getLocale();
  const t = await getTranslations("patients");
  const canWrite = await can(user, "patients:write");
  const canMerge = await can(user, "patients:merge");

  const pageNum = Math.max(1, Number(page) || 1);
  const clinicId = user.currentClinicId ?? "";

  const where: Prisma.PatientWhereInput = {
    clinicId,
    mergedIntoId: null,
    status:
      status === "inactive" ? "INACTIVE"
      : status === "all" ? undefined
      : "ACTIVE",
    gender: gender === "MALE" || gender === "FEMALE" ? gender : undefined,
    city: sp.city || undefined,
    insuranceCompany: sp.insurance || undefined,
    createdAt:
      sp.from || sp.to
        ? {
            gte: sp.from ? new Date(`${sp.from}T00:00:00.000Z`) : undefined,
            lte: sp.to ? new Date(`${sp.to}T23:59:59.999Z`) : undefined,
          }
        : undefined,
    AND: q ? [{ OR: patientSearchOr(q) }] : [],
  };

  const [patients, total, recentViews] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        mrn: true,
        patientId: true,
        firstNameAr: true,
        secondNameAr: true,
        lastNameAr: true,
        firstNameEn: true,
        lastNameEn: true,
        gender: true,
        birthDate: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.patient.count({ where }),
    prisma.patientView.findMany({
      where: { userId: user.id, clinicId, patient: { mergedIntoId: null } },
      orderBy: { viewedAt: "desc" },
      take: 6,
      select: {
        patient: {
          select: {
            id: true,
            mrn: true,
            patientId: true,
            firstNameAr: true,
            secondNameAr: true,
            lastNameAr: true,
            firstNameEn: true,
            lastNameEn: true,
            gender: true,
            birthDate: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const recent = recentViews.map((v) => v.patient);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prevDisabled = pageNum <= 1;
  const nextDisabled = pageNum >= totalPages;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        icon={Users}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/patients/registrations"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent"
            >
              <History className="size-4" />
              {t("registrationHistory")}
            </Link>
            {canMerge && (
              <Link
                href="/patients/merge"
                className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent"
              >
              <GitMerge className="size-4" />
              {t("mergePatients")}
              </Link>
            )}
            {canWrite && <NewPatientButton />}
          </div>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PatientsToolbar
            q={q}
            status={status}
            gender={gender}
            city={city}
            insurance={insurance}
            from={from}
            to={to}
          />
          <p className="text-sm text-muted-foreground">
            {t("resultCount", { count: total })}
          </p>
        </div>

        {recent.length > 0 && !q && !gender && !city && !insurance && !from && !to && pageNum === 1 && (
          <RecentlyViewed patients={recent} locale={locale} />
        )}

        <PatientsTable patients={patients} locale={locale} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2">
            <Link
              href={path({ ...sp }, prevDisabled ? undefined : pageNum - 1)}
              aria-disabled={prevDisabled}
              className="text-sm text-primary underline-offset-4 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              ← {t("previous")}
            </Link>
            <span className="text-sm text-muted-foreground">
              {pageNum} / {totalPages}
            </span>
            <Link
              href={path({ ...sp }, nextDisabled ? undefined : pageNum + 1)}
              aria-disabled={nextDisabled}
              className="text-sm text-primary underline-offset-4 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              {t("next")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import {
  ClipboardList,
  PenLine,
  Pencil,
  Printer,
  Stethoscope,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  REFERRAL_SOURCES,
  VISIT_PRIORITIES,
  VISIT_TYPES,
} from "@/app/[locale]/(app)/visits/schema";

export type PatientVisitFormInitial = {
  mrn: string;
  firstName: string;
  secondName: string;
  familyName: string;
  gender: string;
  birthDate: string;
  city: string;
  phone: string;
  alternatePhone: string;
  address: string;
  price: string;
  visitDate: string;
};

export type PatientVisitFormVisit = {
  type: string;
  priority: string;
  referralSource: string;
  reason: string;
  notes: string;
} | null;

const today = () => new Date().toISOString().slice(0, 10);

const SHEET_CSS = `
.sheet {
  width: min(210mm, 100%);
  min-height: 297mm;
  padding: 13mm;
}
@media (max-width: 768px) {
  .sheet {
    min-height: auto;
    padding: 14px;
    border-radius: 0.75rem;
  }
}
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; }
  .no-print { display: none !important; }
  .sheet {
    width: auto !important;
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }
  .sheet, .sheet * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

const CELL = "border border-slate-200 align-top";

function Info({
  label,
  value,
  colSpan = 1,
}: {
  label: string;
  value?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`${CELL} even:bg-slate-50/50`}>
      <div className="flex min-h-9 flex-col justify-center gap-0.5 px-2 py-1.5 sm:px-3">
        <span className="text-[10px] font-semibold tracking-wide text-slate-400 sm:text-[11px]">
          {label}
        </span>
        <span className="min-w-0 break-words text-xs font-semibold leading-5 text-slate-800 sm:text-sm">
          {value || "—"}
        </span>
      </div>
    </td>
  );
}

function OptionCell({
  label,
  value,
  options,
  colSpan = 1,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  colSpan?: number;
}) {
  const chosen = options.find((o) => o.value === value)?.label;
  return (
    <td colSpan={colSpan} className={`${CELL} even:bg-slate-50/50`}>
      <div className="flex min-h-9 flex-col justify-center gap-0.5 px-2 py-1.5 sm:px-3">
        <span className="text-[10px] font-semibold tracking-wide text-slate-400 sm:text-[11px]">
          {label}
        </span>
        <span className="min-w-0 break-words text-xs font-semibold leading-5 text-slate-800 sm:text-sm">
          {chosen || "—"}
        </span>
      </div>
    </td>
  );
}

function Area({
  label,
  value,
  rows = 3,
  colSpan = 4,
}: {
  label: string;
  value?: string;
  rows?: number;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={CELL}>
      <div className="flex h-full flex-col">
        <span className="border-b border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:px-3 sm:text-[11px]">
          {label}
        </span>
        <div
          className="flex-1 whitespace-pre-wrap px-2 py-1.5 text-xs leading-5 text-slate-900 sm:px-3 sm:py-2 sm:text-sm sm:leading-6"
          style={{ minHeight: `${rows * 1.4}rem` }}
        >
          {value || "\u00A0"}
        </div>
      </div>
    </td>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  colSpan = 4,
}: {
  title: string;
  icon?: LucideIcon;
  colSpan?: number;
}) {
  return (
    <tr>
      <th
        colSpan={colSpan}
        className="border border-slate-200 bg-teal-50 px-2 py-1.5 text-right sm:px-3"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 sm:text-sm">
          {Icon ? <Icon className="size-3.5 shrink-0 sm:size-4" /> : null}
          {title}
        </span>
      </th>
    </tr>
  );
}

export function PatientVisitForm({
  initial,
  clinicName,
  patientId,
  visit,
}: {
  initial: PatientVisitFormInitial;
  clinicName: string;
  patientId: string;
  visit: PatientVisitFormVisit;
}) {
  const t = useTranslations("patients");
  const tv = useTranslations("visits");

  const fullName = [initial.firstName, initial.secondName, initial.familyName]
    .filter(Boolean)
    .join(" ");

  return (
    <div dir="rtl" className="mx-auto w-full">
      <style dangerouslySetInnerHTML={{ __html: SHEET_CSS }} />

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("printForm")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/patients/${patientId}/edit`}>
              <Pencil />
              {t("edit")}
            </Link>
          </Button>
          <Button type="button" size="sm" onClick={() => window.print()}>
            <Printer />
            طباعة
          </Button>
        </div>
      </div>

      <div className="sheet mx-auto rounded-xl bg-white text-slate-900 shadow-xl ring-1 ring-slate-200">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gradient-to-l from-teal-700 to-teal-500 px-4 py-3 text-white sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-lg font-bold ring-1 ring-inset ring-white/30 sm:size-11">
              ✚
            </span>
            <div>
              <p className="text-base font-bold leading-tight sm:text-lg">
                {clinicName || "العيادة"}
              </p>
              <p className="text-[11px] text-teal-50 sm:text-xs">
                نموذج بيانات المريض الطبي
              </p>
            </div>
          </div>
          <div className="flex gap-x-6 text-[11px] sm:text-xs">
            <div>
              <p className="text-teal-100/90">رقم الملف</p>
              <p className="font-mono text-sm font-semibold sm:text-base">
                {initial.mrn || "—"}
              </p>
            </div>
            <div className="border-r border-white/20 pr-6">
              <p className="text-teal-100/90">تاريخ الطباعة</p>
              <p className="font-semibold sm:text-sm">{today()}</p>
            </div>
          </div>
        </header>

        <table className="w-full table-fixed border-collapse text-sm">
          <tbody>
            <SectionHeader title="بيانات المريض" icon={UserRound} />
            <tr>
              <Info label="الاسم" colSpan={2} value={fullName} />
              <Info label="تاريخ التسجيل" value={today()} />
              <Info label="تاريخ الزيارة" value={initial.visitDate} />
            </tr>
            <tr>
              <Info label="تاريخ الميلاد" value={initial.birthDate} />
              <Info label="الجنس" value={initial.gender} />
              <Info label="المدينة" value={initial.city} />
              <Info label="رقم الهاتف" value={initial.phone} />
            </tr>
            <tr>
              <Info label="السعر" value={initial.price} />
              <OptionCell
                label={tv("type")}
                value={visit?.type}
                options={VISIT_TYPES.map((v) => ({ value: v, label: tv(`type_${v}`) }))}
              />
              <OptionCell
                label={tv("priority")}
                value={visit?.priority}
                options={VISIT_PRIORITIES.map((v) => ({
                  value: v,
                  label: tv(`priority_${v}`),
                }))}
              />
              <OptionCell
                label={tv("referralSource")}
                value={visit?.referralSource}
                options={REFERRAL_SOURCES.map((v) => ({
                  value: v,
                  label: tv(`referral_${v}`),
                }))}
              />
            </tr>
            <tr>
              <Info label={tv("reason")} colSpan={2} value={visit?.reason} />
              <Info label={tv("receptionNotes")} colSpan={2} value={visit?.notes} />
            </tr>

            <SectionHeader title="التشخيص والوصفة الطبية" icon={Stethoscope} />
            <tr>
              <Area label="التشخيص" rows={3} />
            </tr>
            <tr>
              <Area label="الوصفة الطبية" rows={4} />
            </tr>

            <SectionHeader title="ملاحظات" icon={ClipboardList} />
            <tr>
              <Area label="ملاحظات إضافية" rows={3} />
            </tr>

            <SectionHeader title="التوقيعات" icon={PenLine} />
            <tr>
              <td colSpan={2} className={CELL}>
                <div className="flex h-20 flex-col justify-between px-2 py-2 sm:h-24 sm:px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">
                    توقيع الطبيب
                  </span>
                  <span className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400 sm:text-[11px]">
                    الاسم / التوقيع
                  </span>
                </div>
              </td>
              <td colSpan={2} className={CELL}>
                <div className="flex h-20 flex-col justify-between px-2 py-2 sm:h-24 sm:px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">
                    توقيع المريض
                  </span>
                  <span className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400 sm:text-[11px]">
                    الاسم / التوقيع
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] text-slate-400">
          <span>{clinicName || "العيادة"}</span>
          <span>صفحة 1 من 1</span>
        </div>
      </div>
    </div>
  );
}

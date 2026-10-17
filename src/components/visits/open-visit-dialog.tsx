"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import {
  listVisitOptions,
  openVisit,
  type VisitOption,
} from "@/app/[locale]/(app)/visits/actions";
import {
  REFERRAL_SOURCES,
  VISIT_PRIORITIES,
  VISIT_TYPES,
  type ReferralSourceValue,
  type VisitPriorityValue,
  type VisitTypeValue,
} from "@/app/[locale]/(app)/visits/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = {
  type: VisitTypeValue;
  priority: VisitPriorityValue;
  referralSource: ReferralSourceValue;
  departmentId: string;
  doctorId: string;
  reason: string;
  notes: string;
};

const INITIAL: FormState = {
  type: "NEW",
  priority: "NORMAL",
  referralSource: "SELF",
  departmentId: "NONE",
  doctorId: "NONE",
  reason: "",
  notes: "",
};

const label = (o: VisitOption, locale: string) =>
  locale === "ar" && o.nameAr ? o.nameAr : o.nameEn || o.nameAr;

export function OpenVisitDialog({
  patientId,
  open,
  onOpenChange,
  trigger,
  initialType,
}: {
  patientId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialType?: VisitTypeValue;
}) {
  const t = useTranslations("visits");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;

  const [options, setOptions] = useState<{
    doctors: VisitOption[];
    departments: VisitOption[];
  }>({ doctors: [], departments: [] });
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    type: initialType ?? INITIAL.type,
  }));

  useEffect(() => {
    if (isOpen) setForm({ ...INITIAL, type: initialType ?? INITIAL.type });
  }, [isOpen, initialType]);

  function setOpen(next: boolean) {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!isOpen || loaded) return;
    let cancelled = false;
    listVisitOptions()
      .then((opts) => {
        if (!cancelled) setOptions(opts);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, loaded]);

  function handleOpenChange(next: boolean) {
    if (next) setForm({ ...INITIAL, type: initialType ?? INITIAL.type });
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    try {
      const res = await openVisit(patientId, {
        route: "DOCTOR",
        type: form.type,
        priority: form.priority,
        referralSource: form.referralSource,
        departmentId:
          form.departmentId && form.departmentId !== "NONE"
            ? form.departmentId
            : undefined,
        doctorId:
          form.doctorId && form.doctorId !== "NONE" ? form.doctorId : undefined,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
      });
      if (res.ok) {
        toast.success(t("visitOpened"));
        setOpen(false);
        router.push(res.redirectTo);
        router.refresh();
        return;
      }
      toast.error(t("actionFailed"));
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent size="lg" className="flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form
          id={`open-visit-${patientId}`}
          onSubmit={submit}
          className="flex-1 overflow-y-auto pe-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>{t("type")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as VisitTypeValue }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`type_${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("priority")}</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, priority: v as VisitPriorityValue }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_PRIORITIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`priority_${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("department")}</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t("none")}</SelectItem>
                  {options.departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {label(d, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("doctor")}</Label>
              <Select
                value={form.doctorId}
                onValueChange={(v) => setForm((f) => ({ ...f, doctorId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t("none")}</SelectItem>
                  {options.doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {label(d, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="ov-reason">{t("reason")}</Label>
              <Input
                id="ov-reason"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("referralSource")}</Label>
              <Select
                value={form.referralSource}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    referralSource: v as ReferralSourceValue,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`referral_${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ov-notes">{t("receptionNotes")}</Label>
              <Input
                id="ov-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        </form>

        <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form={`open-visit-${patientId}`} disabled={submitting || !patientId}>
            {submitting ? tc("saving") : t("saveVisit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

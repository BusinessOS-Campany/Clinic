"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, type Watch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createPatient, updatePatient } from "@/app/[locale]/(app)/patients/actions";
import { checkDuplicatePatient } from "@/app/[locale]/(app)/patients/identity-actions";
import { patientFormSchema, type PatientFormValues, type PatientFormInput } from "@/app/[locale]/(app)/patients/schema";
import type { DuplicateCandidate } from "@/lib/patients-duplicates";
import { OpenVisitDialog } from "@/components/visits/open-visit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DuplicateWarning } from "@/components/patients/duplicate-warning";
import type { VisitTypeValue } from "@/app/[locale]/(app)/visits/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/app/[locale]/(app)/patients/schema";

export function PatientForm({
  patientId,
  initial,
}: {
  patientId?: string;
  initial?: Partial<PatientFormValues> & { gender?: "MALE" | "FEMALE" };
}) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [pendingValues, setPendingValues] = useState<PatientFormValues | null>(null);
  const [pendingOpenVisit, setPendingOpenVisit] = useState(false);
  const [visitPatientId, setVisitPatientId] = useState<string | null>(null);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [visitType, setVisitType] = useState<VisitTypeValue>("NEW");

  const { watch, ...form } = useForm<PatientFormInput, unknown, PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      gender: "MALE",
      price: 0,
      ...initial,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const firstNameAr = watch("firstNameAr");
  const secondNameAr = watch("secondNameAr");
  const lastNameAr = watch("lastNameAr");
  const phone = watch("phone");
  const phone2 = watch("phone2");

  // Live duplicate detection while registering.
  useEffect(() => {
    if (patientId) return;
    const first = (firstNameAr ?? "").trim();
    const last = (lastNameAr ?? "").trim();
    const tel = (phone ?? "").trim();
    if (first.length < 2 && tel.length < 6) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await checkDuplicatePatient(
          {
            firstNameAr: first,
            secondNameAr: secondNameAr || "",
            lastNameAr: last,
            phone: phone,
            phone2: phone2 || "",
            birthDate: watch("birthDate"),
          },
          patientId,
        );
        if (cancelled) return;
        setCandidates(res.probable);
        setBlocked(res.blocked);
      } catch {
        // Detection is advisory; a failure must not block registration.
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [firstNameAr, secondNameAr, lastNameAr, phone, phone2, patientId]);

  async function save(
    values: PatientFormValues,
    confirmDuplicate = false,
    openVisitAfter = false,
  ) {
    setSubmitting(true);
    try {
      const options = {
      ...(confirmDuplicate ? { confirmDuplicate: true } : {}),
      enqueue: !openVisitAfter,
    };
      const res = patientId
        ? await updatePatient(patientId, values, options)
        : await createPatient(values, options);
      if (res.ok) {
        setCandidates([]);
        setPendingValues(null);
        setPendingOpenVisit(false);

        if (openVisitAfter) {
          setVisitPatientId(res.id);
          setVisitDialogOpen(true);
          return;
        }

        toast.success(patientId ? t("updateSuccess") : t("saveSuccess"));
        router.push(`/patients/${res.id}`);
        router.refresh();
        return;
      }

      if (res.candidates?.length) {
        setCandidates(res.candidates);
        setBlocked(res.error === "duplicate-national-id");
        setPendingValues(values);
        setPendingOpenVisit(openVisitAfter);
      }
      toast.error(errorMessage(res.error));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(values: PatientFormValues) {
    await save(values);
  }

  async function onOpenVisit(values: PatientFormValues) {
    await save(values, false, true);
  }

  async function confirmAndSave() {
    if (!pendingValues) return;
    await save(pendingValues, true, pendingOpenVisit);
  }

  function errorMessage(error: string) {
    if (error === "duplicate-national-id") return t("duplicateNationalId");
    if (error === "duplicate-mrn") return t("duplicateMrn");
    if (error === "possible-duplicate") return t("possibleDuplicate");
    return t("saveFailed");
  }

  function fieldError(key: keyof PatientFormValues) {
    const message = errors[key];
    if (!message) return null;
    return <p className="text-sm text-destructive">{tc("required")}</p>;
  }

  return (
    <div>
      {candidates.length > 0 && (
        <DuplicateWarning
          candidates={candidates}
          blocked={blocked}
          busy={submitting}
          onConfirm={() => {
            setCandidates([]);
            setPendingValues(null);
            setPendingOpenVisit(false);
          }}
          onDismiss={() => {
            setCandidates([]);
            setPendingValues(null);
            setPendingOpenVisit(false);
          }}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstNameAr">{t("firstNameAr")} *</Label>
            <Input id="firstNameAr" {...register("firstNameAr")} />
            {fieldError("firstNameAr")}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="secondNameAr">{t("secondNameAr")}</Label>
            <Input id="secondNameAr" {...register("secondNameAr")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastNameAr">{t("lastNameAr")} *</Label>
            <Input id="lastNameAr" {...register("lastNameAr")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!patientId && (
            <div className="flex flex-col gap-2">
              <Label>{t("visitType")}</Label>
              <Select
                value={visitType}
                onValueChange={(v) => setVisitType(v as VisitTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">{t("visitType_NEW")}</SelectItem>
                  <SelectItem value="FOLLOW_UP">
                    {t("visitType_FOLLOW_UP")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="gender">{t("gender")}</Label>
            <Select
              value={watch("gender")}
              onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t("male")}</SelectItem>
                <SelectItem value="FEMALE">{t("female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birthDate">{t("dateOfBirth")}</Label>
            <Input id="birthDate" type="date" {...register("birthDate")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">{t("city")}</Label>
            <Select
              value={watch("city") ?? "NONE"}
              onValueChange={(v) =>
                setValue("city", (v === "NONE" ? undefined : v) as never)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">{tc("none")}</SelectItem>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`city_${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" dir="ltr" placeholder="+967 7XX XXX XXX" {...register("phone")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone2">{t("phone2")}</Label>
            <Input id="phone2" dir="ltr" placeholder="+967 7XX XXX XXX" {...register("phone2")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">{t("price")} *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              {...register("price")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </div>

        <div className="flex flex-wrap items-end justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(onOpenVisit)()}
          >
            {submitting ? tc("saving") : t("saveAndOpenVisit")}
          </Button>
        </div>

        <OpenVisitDialog
          patientId={visitPatientId}
          open={visitDialogOpen}
          initialType={visitType}
          onOpenChange={(o) => {
            setVisitDialogOpen(o);
            if (!o && visitPatientId) {
              router.push(`/patients/${visitPatientId}`);
              router.refresh();
            }
          }}
        />
      </form>
    </div>
  );
}
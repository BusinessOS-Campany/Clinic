"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createPatient, updatePatient, type DuplicatePatient } from "@/app/[locale]/(app)/patients/actions";
import {
  GOVERNORATES,
  INSURANCE_COMPANIES,
  patientFormSchema,
  type PatientFormValues,
} from "@/app/[locale]/(app)/patients/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PatientForm({
  patientId,
  initial,
  onCancel,
}: {
  patientId?: string;
  initial?: Partial<PatientFormValues> & { gender?: "MALE" | "FEMALE" };
  onCancel?: () => void;
}) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePatient[]>([]);
  const [pending, setPending] = useState<PatientFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      gender: "MALE",
      ...initial,
    },
  });

  async function onSubmit(values: PatientFormValues) {
    setSubmitting(true);
    try {
      const res = patientId
        ? await updatePatient(patientId, values)
        : await createPatient(values);
      if (res.ok) {
        toast.success(patientId ? t("updateSuccess") : t("saveSuccess"));
        router.push(`/patients/${res.id}`);
        router.refresh();
      } else if (!patientId && res.error === "duplicate") {
        setPending(values);
        setDuplicates(res.duplicates ?? []);
      } else {
        toast.error(t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDespiteDuplicates() {
    if (!pending) return;
    setSubmitting(true);
    try {
      const res = await createPatient(pending, { allowDuplicate: true });
      if (res.ok) {
        toast.success(t("saveSuccess"));
        setDuplicates([]);
        setPending(null);
        router.push(`/patients/${res.id}`);
        router.refresh();
      } else {
        toast.error(t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(key: keyof PatientFormValues) {
    const message = errors[key];
    if (!message) return null;
    return <p className="text-sm text-destructive">{tc("required")}</p>;
  }

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
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
          {fieldError("lastNameAr")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>{t("gender")}</Label>
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
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" dir="ltr" {...register("phone")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone2">{t("phone2")}</Label>
          <Input id="phone2" dir="ltr" {...register("phone2")} />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <Label>{t("insuranceCompany")}</Label>
          <Select
            value={watch("insuranceCompany") ?? "NONE"}
            onValueChange={(v) =>
              setValue("insuranceCompany", v === "NONE" ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{tc("none")}</SelectItem>
              {INSURANCE_COMPANIES.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>{t("city")}</Label>
          <Select
            value={watch("city") ?? "NONE"}
            onValueChange={(v) =>
              setValue("city", v === "NONE" ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{tc("none")}</SelectItem>
              {GOVERNORATES.map((gov) => (
                <SelectItem key={gov} value={gov}>
                  {gov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">{t("address")}</Label>
          <Textarea id="address" rows={3} {...register("address")} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel ?? (() => router.back())}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc("saving") : tc("save")}
        </Button>
      </div>
    </form>
    <AlertDialog
      open={duplicates.length > 0}
      onOpenChange={(open) => {
        if (!open) {
          setDuplicates([]);
          setPending(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("duplicateWarning")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("duplicateDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          {duplicates.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {[d.firstNameAr, d.secondNameAr, d.lastNameAr]
                  .filter(Boolean)
                  .join(" ")}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {d.mrn} · {d.patientId}
              </span>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void saveDespiteDuplicates();
            }}
          >
            {t("saveAnyway")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
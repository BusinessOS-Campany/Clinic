"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import {
  createAppointment,
  updateAppointment,
} from "@/app/[locale]/(app)/appointments/actions";
import {
  APPOINTMENT_TYPES,
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/app/[locale]/(app)/appointments/schema";
import { PatientPicker } from "@/components/appointments/patient-picker";
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

type Option = { id: string; label: string };

export function AppointmentForm({
  appointmentId,
  initial,
  doctors,
  departments,
  rooms,
}: {
  appointmentId?: string;
  initial?: Partial<AppointmentFormValues> & { patientLabel?: string };
  doctors: Option[];
  departments: Option[];
  rooms: Option[];
}) {
  const t = useTranslations("appointments");
  const tc = useTranslations("common");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      ...initial,
      doctorId: initial?.doctorId ?? "",
      patientId: initial?.patientId ?? "",
      date: initial?.date ?? "",
      startTime: initial?.startTime ?? "09:00",
      durationMinutes: initial?.durationMinutes ?? 30,
      type: initial?.type ?? "CONSULTATION",
    },
  });

  async function onSubmit(values: AppointmentFormValues) {
    setSubmitting(true);
    try {
      const res = appointmentId
        ? await updateAppointment(appointmentId, values)
        : await createAppointment(values);
      if (res.ok) {
        toast.success(
          appointmentId ? t("updateSuccess") : t("createSuccess"),
        );
        router.push(`/appointments/${res.id}`);
        router.refresh();
      } else if (res.error === "conflict") {
        toast.error(t("conflictDetected"));
      } else {
        toast.error(t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(key: keyof AppointmentFormValues) {
    return errors[key] ? (
      <p className="text-sm text-destructive">{tc("required")}</p>
    ) : null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>{t("patient")} *</Label>
        <PatientPicker
          value={watch("patientId") ?? ""}
          initialLabel={initial?.patientLabel}
          invalid={Boolean(errors.patientId)}
          onChange={(id) => {
            setValue("patientId", id);
            if (id) trigger("patientId");
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>{t("doctor")} *</Label>
          <Select
            value={watch("doctorId") ?? ""}
            onValueChange={(v) => setValue("doctorId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("doctorId")}
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("type")}</Label>
          <Select
            value={watch("type") ?? "CONSULTATION"}
            onValueChange={(v) => setValue("type", v as never)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TYPES.map((ty) => (
                <SelectItem key={ty} value={ty}>
                  {t(`type_${ty}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">{t("date")} *</Label>
          <Input id="date" type="date" {...register("date")} />
          {fieldError("date")}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">{t("startTime")} *</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
          {fieldError("startTime")}
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("duration")}</Label>
          <Select
            value={String(watch("durationMinutes") ?? 30)}
            onValueChange={(v) => setValue("durationMinutes", Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {t(`duration_${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("department")}</Label>
          <Select
            value={watch("departmentId") ?? "NONE"}
            onValueChange={(v) =>
              setValue("departmentId", v === "NONE" ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{tc("none")}</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("room")}</Label>
          <Select
            value={watch("roomId") ?? "NONE"}
            onValueChange={(v) =>
              setValue("roomId", v === "NONE" ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{tc("none")}</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">{t("reason")}</Label>
        <Input id="reason" {...register("reason")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc("saving") : tc("save")}
        </Button>
      </div>
    </form>
  );
}
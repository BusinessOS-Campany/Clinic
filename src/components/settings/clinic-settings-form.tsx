"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveClinicSettings } from "@/app/[locale]/(app)/settings/actions";
import { clinicSettingsSchema, type ClinicSettingsFormValues } from "@/app/[locale]/(app)/settings/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const timezones = ["Asia/Aden", "Asia/Riyadh", "Asia/Dubai", "UTC"];

export function ClinicSettingsForm({
  initial,
}: {
  initial: ClinicSettingsFormValues;
}) {
  const tc = useTranslations("common");
  const tu = useTranslations("user");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: ClinicSettingsFormValues) {
    setSubmitting(true);
    try {
      const res = await saveClinicSettings(values);
      if (res.ok) toast.success(tc("success"));
    } catch {
      toast.error(tc("failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...register("currency")} />
          {errors.currency && (
            <p className="text-sm text-destructive">{tc("required")}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Timezone</Label>
          <Select
            value={watch("timezone")}
            onValueChange={(v) => setValue("timezone", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Default language</Label>
          <Select
            value={watch("locale")}
            onValueChange={(v) => setValue("locale", v as "ar" | "en")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">{tu("lang_ar")}</SelectItem>
              <SelectItem value="en">{tu("lang_en")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateFormat">Date format</Label>
          <Input id="dateFormat" {...register("dateFormat")} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? tc("saving") : tc("save")}
        </Button>
      </div>
    </form>
  );
}
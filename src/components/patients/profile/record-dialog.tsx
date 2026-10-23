"use client";

import { useState } from "react";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  createProfileRecord,
  updateProfileRecord,
} from "@/app/[locale]/(app)/patients/profile-actions";
import {
  defaultValuesFor,
  entityConfig,
  type ProfileEntity,
  type RecordField,
  type RecordValues,
} from "@/lib/patient-profile/entities";
import { cn } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RecordDialog({
  entity,
  patientId,
  recordId,
  initialValues,
  trigger = "add",
}: {
  entity: ProfileEntity;
  patientId: string;
  recordId?: string;
  initialValues?: RecordValues;
  trigger?: "add" | "edit";
}) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const config = entityConfig(entity);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(recordId);
  const formId = `record-form-${entity}-${recordId ?? "new"}`;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecordValues>({
    defaultValues: { ...defaultValuesFor(config), ...initialValues },
  });

  function handleOpenChange(next: boolean) {
    if (next) reset({ ...defaultValuesFor(config), ...initialValues });
    setOpen(next);
  }

  async function onSubmit(values: RecordValues) {
    setSubmitting(true);
    try {
      const res = recordId
        ? await updateProfileRecord(entity, recordId, values)
        : await createProfileRecord(entity, patientId, values);
      if (res.ok) {
        toast.success(isEdit ? t("recordUpdated") : t("recordSaved"));
        setOpen(false);
        router.refresh();
      } else if (res.error === "not-found") {
        toast.error(t("notFound"));
      } else {
        toast.error(t("actionFailed"));
      }
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger === "edit" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={tc("edit")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus />
            {t("addRecord")}
          </Button>
        )}
      </DialogTrigger>
<DialogContent className="max-h-[calc(100dvh-2rem)] flex flex-col" size="default">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {isEdit ? tc("edit") : tc("create")} · {t(config.singularKey)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <form id="record-dialog-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {config.fields.map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    register={register}
                    setValue={setValue}
                    value={watch(field.name)}
                    invalid={Boolean(errors[field.name])}
                  />
                ))}
              </div>
            </form>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" form="record-dialog-form" disabled={submitting}>
              {submitting ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

function FieldControl({
  field,
  register,
  setValue,
  value,
  invalid,
}: {
  field: RecordField;
  register: UseFormRegister<RecordValues>;
  setValue: UseFormSetValue<RecordValues>;
  value: RecordValues[string];
  invalid: boolean;
}) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const inputId = `record-${field.name}`;
  const wide = field.span === 2;

  const label = (
    <Label htmlFor={field.kind === "switch" ? undefined : inputId}>
      {t(field.labelKey)}
      {field.required ? " *" : ""}
    </Label>
  );

  const control = (() => {
    switch (field.kind) {
      case "textarea":
        return (
          <Textarea id={inputId} rows={3} {...register(field.name)} />
        );
      case "select":
        return (
          <Select
            value={typeof value === "string" ? value : ""}
            onValueChange={(v) =>
              setValue(field.name, v, { shouldDirty: true })
            }
          >
            <SelectTrigger id={inputId}>
              <SelectValue placeholder={tc("none")} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "switch":
        return (
          <div className="flex h-9 items-center">
            <Switch
              id={inputId}
              checked={value === true}
              onCheckedChange={(checked) => setValue(field.name, checked)}
            />
          </div>
        );
      case "date":
        return <Input id={inputId} type="date" {...register(field.name)} />;
      case "number":
        return (
          <Input
            id={inputId}
            type="number"
            dir={field.ltr ? "ltr" : undefined}
            {...register(field.name)}
          />
        );
      default:
        return (
          <Input
            id={inputId}
            dir={field.ltr ? "ltr" : undefined}
            {...register(field.name, {
              required: field.required ? tc("required") : false,
            })}
          />
        );
    }
  })();

  return (
    <div className={cn("flex flex-col gap-2", wide && "sm:col-span-2")}>
      {label}
      {control}
      {invalid && field.kind !== "switch" && field.kind !== "select" && (
        <p className="text-sm text-destructive">
          {field.required ? tc("required") : t("invalidInput")}
        </p>
      )}
    </div>
  );
}
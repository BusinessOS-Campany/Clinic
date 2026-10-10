"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, GitMerge, Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { mergePatients } from "@/app/[locale]/(app)/patients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type PatientOption = {
  id: string;
  mrn: string;
  patientId: string;
  firstNameAr: string;
  secondNameAr: string | null;
  lastNameAr: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  phone: string | null;
};

function label(p: PatientOption, locale: string) {
  const ar = [p.firstNameAr, p.secondNameAr, p.lastNameAr].filter(Boolean).join(" ");
  const en = [p.firstNameEn, p.lastNameEn].filter(Boolean).join(" ");
  return locale === "ar" ? ar || en : en || ar;
}

function PatientPicker({
  value,
  onSelect,
  excludeId,
  hint,
}: {
  value: PatientOption | null;
  onSelect: (p: PatientOption | null) => void;
  excludeId?: string;
  hint: string;
}) {
  const t = useTranslations("patients");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PatientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q.trim())}`);
        const data = (await res.json()) as { items?: PatientOption[] };
        setItems((data.items ?? []).filter((p) => p.id !== excludeId));
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [q, excludeId]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {label(value, document.documentElement.lang || "ar")}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {value.mrn} · {value.patientId}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          aria-label={t("clearSelection")}
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute start-2.5 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder={t("searchPlaceholder")}
          className="h-9 ps-8"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
          {loading && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">…</p>
          )}
          {!loading && items.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {t("noResults")}
            </p>
          )}
          {items.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p);
                setQ("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-accent"
            >
              <span className="truncate">
                {label(p, document.documentElement.lang || "ar")}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {p.mrn}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MergePatients({ canMerge }: { canMerge: boolean }) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [target, setTarget] = useState<PatientOption | null>(null);
  const [source, setSource] = useState<PatientOption | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ready = Boolean(target && source && target.id !== source.id);

  async function run() {
    if (!target || !source) return;
    setSubmitting(true);
    try {
      const res = await mergePatients(source.id, target.id);
      if (res.ok) {
        toast.success(t("mergeSuccess"));
        setConfirmOpen(false);
        router.push(`/patients/${target.id}`);
        router.refresh();
      } else {
        toast.error(
          res.error === "same-patient"
            ? t("mergeSamePatient")
            : res.error === "already-merged"
              ? t("mergeAlreadyMerged")
              : t("mergeFailed"),
        );
      }
    } catch {
      toast.error(t("mergeFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canMerge) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("mergeNotAuthorized")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <Label className="text-base">
            <Check className="inline size-4 text-primary" /> {t("primaryPatient")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("primaryPatientHint")}
          </p>
          <PatientPicker
            value={target}
            onSelect={setTarget}
            excludeId={source?.id}
            hint={t("primaryPatientHint")}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <Label className="text-base">
            <GitMerge className="inline size-4 text-destructive" />{" "}
            {t("duplicatePatient")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("duplicatePatientHint")}
          </p>
          <PatientPicker
            value={source}
            onSelect={setSource}
            excludeId={target?.id}
            hint={t("duplicatePatientHint")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          {ready
            ? t("mergeSummary", {
                source: label(source!, document.documentElement.lang || "ar"),
                target: label(target!, document.documentElement.lang || "ar"),
              })
            : t("mergeSelectBoth")}
        </p>
        <Button
          variant="destructive"
          disabled={!ready || submitting}
          onClick={() => setConfirmOpen(true)}
        >
          <GitMerge />
          {t("mergePatients")}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mergeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mergeConfirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void run();
              }}
              disabled={submitting}
            >
              {submitting ? tc("saving") : t("mergeAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

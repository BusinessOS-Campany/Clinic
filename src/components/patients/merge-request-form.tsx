"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { requestPatientMerge } from "@/app/[locale]/(app)/patients/identity-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type PatientHit = {
  id: string;
  mrn: string;
  firstNameAr: string;
  secondNameAr: string | null;
  lastNameAr: string;
  phone: string | null;
  nationalId: string | null;
};

const ERROR_KEYS = [
  "no-clinic",
  "not-found",
  "forbidden",
  "self-approval",
  "already-decided",
  "invalid-selection",
] as const;

export function MergeRequestForm({ primary }: { primary: PatientHit }) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientHit[]>([]);
  const [selected, setSelected] = useState<PatientHit[]>([]);
  const [reason, setReason] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  async function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(value.trim())}`);
      const data = (await res.json()) as { items?: PatientHit[] };
      setResults((data.items ?? []).filter((item) => item.id !== primary.id));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function toggle(hit: PatientHit) {
    setSelected((prev) =>
      prev.some((p) => p.id === hit.id)
        ? prev.filter((p) => p.id !== hit.id)
        : [...prev, hit],
    );
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await requestPatientMerge({
        primaryId: primary.id,
        duplicateIds: selected.map((s) => s.id),
        reason,
      });
      if (res.ok) {
        toast.success(t("mergeRequested"));
        router.push("/patients/merges");
        router.refresh();
      } else {
        const key = ERROR_KEYS.includes(res.error as (typeof ERROR_KEYS)[number])
          ? (res.error as string)
          : "not-found";
        toast.error(t(`mergeError_${key}`));
      }
    } catch {
      toast.error(tc("failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">{t("mergePrimaryLabel")}</p>
        <p className="text-sm font-medium">
          <span className="font-mono">{primary.mrn}</span> · {primary.firstNameAr}{" "}
          {primary.lastNameAr}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="merge-search">{t("mergeSearchDuplicates")}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="merge-search"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9 pe-9"
          />
          {searching && (
            <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => toggle(hit)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-start transition-colors hover:bg-accent"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {hit.firstNameAr} {hit.secondNameAr} {hit.lastNameAr}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{hit.mrn}</span>
                    {hit.phone && <span dir="ltr">{hit.phone}</span>}
                    {hit.nationalId && <span dir="ltr">{hit.nationalId}</span>}
                  </span>
                </span>
                <Badge variant={selectedIds.has(hit.id) ? "success" : "secondary"}>
                  {selectedIds.has(hit.id) ? t("selected") : tc("add")}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>{t("mergeSelected")}</Label>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <Badge key={s.id} variant="outline" className="gap-1.5">
                <span className="font-mono">{s.mrn}</span>
                <button
                  type="button"
                  aria-label={tc("delete")}
                  onClick={() => toggle(s)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="merge-reason">{t("mergeReason")}</Label>
        <Textarea
          id="merge-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("mergeReasonPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tc("cancel")}
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={submitting || selected.length === 0}
        >
          {submitting ? tc("saving") : t("submitMergeRequest")}
        </Button>
      </div>
    </div>
  );
}
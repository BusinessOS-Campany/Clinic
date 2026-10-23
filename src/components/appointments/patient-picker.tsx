"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PatientOption = {
  id: string;
  mrn: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
};

function label(option: PatientOption, locale: string) {
  const latin = [option.firstNameEn, option.lastNameEn].filter(Boolean).join(" ");
  const arabic = `${option.firstNameAr} ${option.lastNameAr}`;
  return locale === "ar" ? arabic || latin : latin || arabic;
}

export function PatientPicker({
  value,
  onChange,
  initialLabel,
  invalid,
}: {
  value: string;
  onChange: (id: string, label: string) => void;
  initialLabel?: string;
  invalid?: boolean;
}) {
  const t = useTranslations("appointments");
  const fc = useTranslations("common");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickedId, setPickedId] = useState(value);
  const [pickedLabel, setPickedLabel] = useState(initialLabel ?? "");

  async function runSearch(q: string) {
    setQuery(q);
    setOpen(true);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { items: PatientOption[] };
      setResults(data.items ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {pickedId ? (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{pickedLabel}</span>
          <button
            type="button"
            aria-label={t("patient")}
            onClick={() => {
              setPickedId("");
              setPickedLabel("");
              onChange("", "");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={t("searchPatientPlaceholder")}
            className={cn("ps-9", invalid && "border-destructive focus-visible:ring-destructive/30")}
          />
          {open && (query.trim() || loading) && (
            <ul className="absolute mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
              {loading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {fc("loading")}
                </li>
              )}
              {!loading && results.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {t("noPatientFound")}
                </li>
              )}
              {!loading &&
                results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const lbl = label(item, locale);
                        setPickedId(item.id);
                        setPickedLabel(lbl);
                        setQuery("");
                        setOpen(false);
                        onChange(item.id, lbl);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm hover:bg-accent"
                    >
                      <span className="font-medium">{label(item, locale)}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.mrn}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
      {invalid && !pickedId && (
        <p className="text-sm text-destructive">{fc("required")}</p>
      )}
    </div>
  );
}
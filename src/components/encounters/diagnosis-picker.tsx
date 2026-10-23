"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { searchDiagnosisCatalog } from "@/app/[locale]/(app)/encounters/actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DiagnosisPickerValue = {
  code: string;
  name: string;
  classification: string;
  codeSystem: string;
};

type CatalogEntry = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  classification: string;
};

export function DiagnosisPicker({
  value,
  onChange,
}: {
  value: DiagnosisPickerValue | null;
  onChange: (entry: DiagnosisPickerValue | null) => void;
}) {
  const t = useTranslations("encounters");
  const locale = useLocale();
  const [query, setQuery] = useState(value?.name ?? "");
  const [items, setItems] = useState<CatalogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    [],
  );

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchDiagnosisCatalog(q);
      if (res.ok) setItems(res.items);
      setLoading(false);
    }, 250);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    onChange({ code: "", name: q, classification: "", codeSystem: "" });
    search(q);
  }

  function focus() {
    setOpen(true);
    if (items.length === 0) search("");
  }

  function handleBlur() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function select(entry: CatalogEntry) {
    onChange({
      code: entry.code,
      name: locale === "ar" ? entry.nameAr : entry.nameEn,
      classification: entry.classification,
      codeSystem: entry.classification !== "LOCAL" ? entry.classification : "",
    });
    setQuery(locale === "ar" ? entry.nameAr : entry.nameEn);
    setOpen(false);
  }

  const showName = (entry: CatalogEntry) => (locale === "ar" ? entry.nameAr : entry.nameEn);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-8"
          value={query}
          onChange={handleChange}
          onFocus={focus}
          onBlur={handleBlur}
          placeholder={t("diagnosisSearch")}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {loading && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("searching")}</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("noResults")}</div>
          )}
          {items.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(entry)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                value?.code === entry.code && "bg-accent",
              )}
            >
              <span className="truncate">{showName(entry)}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{entry.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
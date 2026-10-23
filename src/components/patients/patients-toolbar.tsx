"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { CITIES } from "@/app/[locale]/(app)/patients/schema";
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

const FILTER_KEYS = [
  "q",
  "status",
  "gender",
  "city",
  "ageMin",
  "ageMax",
  "registeredFrom",
  "registeredTo",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

const DEBOUNCE_MS = 300;

function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative z-10 flex h-full w-full max-w-sm flex-col gap-5 overflow-y-auto border-s bg-card p-5 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export function PatientsToolbar() {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = useMemo(() => {
    const get = (k: FilterKey) => searchParams.get(k) ?? "";
    return {
      q: get("q"),
      status: get("status") || "active",
      gender: get("gender"),
      city: get("city"),
      ageMin: get("ageMin"),
      ageMax: get("ageMax"),
      registeredFrom: get("registeredFrom"),
      registeredTo: get("registeredTo"),
    };
  }, [searchParams]);

  const [value, setValue] = useState(current.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(current.q);
  }, [current.q]);

  const push = useCallback(
    (patch: Partial<Record<FilterKey, string>>) => {
      const merged: Record<FilterKey, string> = { ...current, ...patch };
      const params = new URLSearchParams();
      for (const key of FILTER_KEYS) {
        const v = merged[key] ?? "";
        if (!v || (key === "status" && v === "active")) continue;
        params.set(key, v);
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [current, pathname, router],
  );

  // Live search: debounce keystrokes into a URL update.
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === current.q) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ q: trimmed }), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, current.q, push]);

  const activeFilterCount = (["gender", "city", "ageMin", "ageMax", "registeredFrom", "registeredTo"] as FilterKey[]).filter(
    (k) => Boolean(current[k]),
  ).length;

  function resetAdvanced() {
    push({ gender: "", city: "", ageMin: "", ageMax: "", registeredFrom: "", registeredTo: "" });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="ps-9 pe-9"
          />
          {pending && (
            <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <Select
          value={current.status}
          onValueChange={(v) => push({ status: v === "active" ? "" : v })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t("statusActive")}</SelectItem>
            <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
            <SelectItem value="all">{tc("all")}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setSheetOpen(true)}
        >
          <SlidersHorizontal className="size-4" />
          {tc("search")}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {(activeFilterCount > 0 || current.q) && (
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => {
              setValue("");
              resetAdvanced();
              push({ q: "", status: "" });
            }}
          >
            <RotateCcw className="size-4" />
            {tc("close")}
          </Button>
        )}
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t("advancedFilters")}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSheetOpen(false)}>
            {tc("close")}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("gender")}</Label>
          <Select
            value={current.gender || "any"}
            onValueChange={(v) => push({ gender: v === "any" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{tc("all")}</SelectItem>
              <SelectItem value="male">{t("male")}</SelectItem>
              <SelectItem value="female">{t("female")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("city")}</Label>
          <Select
            value={current.city || "any"}
            onValueChange={(v) => push({ city: v === "any" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{tc("all")}</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`city_${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ageMin">{t("ageFrom")}</Label>
            <Input
              id="ageMin"
              type="number"
              min={0}
              max={120}
              inputMode="numeric"
              defaultValue={current.ageMin}
              onBlur={(e) => push({ ageMin: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ageMax">{t("ageTo")}</Label>
            <Input
              id="ageMax"
              type="number"
              min={0}
              max={120}
              inputMode="numeric"
              defaultValue={current.ageMax}
              onBlur={(e) => push({ ageMax: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="registeredFrom">{t("registeredFrom")}</Label>
            <Input
              id="registeredFrom"
              type="date"
              defaultValue={current.registeredFrom}
              onChange={(e) => push({ registeredFrom: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="registeredTo">{t("registeredTo")}</Label>
            <Input
              id="registeredTo"
              type="date"
              defaultValue={current.registeredTo}
              onChange={(e) => push({ registeredTo: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={resetAdvanced}>
            {tc("close")}
          </Button>
          <Button type="button" className="flex-1" onClick={() => setSheetOpen(false)}>
            {tc("search")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
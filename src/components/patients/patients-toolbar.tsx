"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GOVERNORATES,
  INSURANCE_COMPANIES,
} from "@/app/[locale]/(app)/patients/schema";

type Filters = {
  q?: string;
  status?: string;
  gender?: string;
  city?: string;
  insurance?: string;
  from?: string;
  to?: string;
};

const NONE = "__none__";

export function PatientsToolbar(props: Filters) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(props.q ?? "");
  const [status, setStatus] = useState(props.status ?? "active");
  const [gender, setGender] = useState(props.gender ?? "");
  const [city, setCity] = useState(props.city ?? "");
  const [insurance, setInsurance] = useState(props.insurance ?? "");
  const [from, setFrom] = useState(props.from ?? "");
  const [to, setTo] = useState(props.to ?? "");
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilters = [gender, city, insurance, from, to].filter(Boolean)
    .length;

  function build(
    next: Partial<Filters> & { q?: string },
    replace: boolean,
  ) {
    const v: Filters = {
      q: next.q ?? q,
      status: next.status ?? status,
      gender: next.gender ?? gender,
      city: next.city ?? city,
      insurance: next.insurance ?? insurance,
      from: next.from ?? from,
      to: next.to ?? to,
    };
    const params = new URLSearchParams();
    if (v.q && v.q.trim()) params.set("q", v.q.trim());
    if (v.status && v.status !== "active") params.set("status", v.status);
    if (v.gender) params.set("gender", v.gender);
    if (v.city) params.set("city", v.city);
    if (v.insurance) params.set("insurance", v.insurance);
    if (v.from) params.set("from", v.from);
    if (v.to) params.set("to", v.to);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (replace) router.replace(url);
    else router.push(url);
  }

  function onQ(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => build({ q: value }, true), 300);
  }

  function reset() {
    setQ("");
    setStatus("active");
    setGender("");
    setCity("");
    setInsurance("");
    setFrom("");
    setTo("");
    router.replace(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex w-full max-w-sm items-center">
        <Search className="pointer-events-none absolute start-2.5 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 ps-8"
        />
        {q && (
          <button
            type="button"
            onClick={() => onQ("")}
            aria-label={tc("search")}
            className="absolute end-2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Select value={status} onValueChange={(v) => { setStatus(v); build({ status: v }, false); }}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">{t("statusActive")}</SelectItem>
          <SelectItem value="inactive">{t("statusInactive")}</SelectItem>
          <SelectItem value="all">{tc("all")}</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9">
            <SlidersHorizontal />
            {t("filters")}
            {activeFilters > 0 && (
              <span className="ms-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold">{t("filters")}</p>

            <div className="flex flex-col gap-2">
              <Label>{t("gender")}</Label>
              <Select
                value={gender || NONE}
                onValueChange={(v) => {
                  const val = v === NONE ? "" : v;
                  setGender(val);
                  build({ gender: val }, false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{tc("all")}</SelectItem>
                  <SelectItem value="MALE">{t("male")}</SelectItem>
                  <SelectItem value="FEMALE">{t("female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("city")}</Label>
              <Select
                value={city || NONE}
                onValueChange={(v) => {
                  const val = v === NONE ? "" : v;
                  setCity(val);
                  build({ city: val }, false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{tc("all")}</SelectItem>
                  {GOVERNORATES.map((gov) => (
                    <SelectItem key={gov} value={gov}>
                      {gov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("insuranceCompany")}</Label>
              <Select
                value={insurance || NONE}
                onValueChange={(v) => {
                  const val = v === NONE ? "" : v;
                  setInsurance(val);
                  build({ insurance: val }, false);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{tc("none")}</SelectItem>
                  {INSURANCE_COMPANIES.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="filter-from">{t("registeredFrom")}</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onBlur={() => build({ from }, false)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="filter-to">{t("registeredTo")}</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onBlur={() => build({ to }, false)}
                />
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={reset}>
                {t("clearFilters")}
              </Button>
              <Button size="sm" onClick={() => { setOpen(false); build({}, false); }}>
                {tc("confirm")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

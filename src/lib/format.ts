const moneyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function fmtMoney(value: number | string | bigint | { toNumber(): number } | null | undefined): string {
  if (value == null) return "0";
  const n = typeof value === "object" ? value.toNumber() : Number(value);
  return moneyFmt.format(Number.isFinite(n) ? n : 0);
}

export function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "object" && "toNumber" in (value as object)) {
    return (value as { toNumber(): number }).toNumber();
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function fmtInt(value: number | bigint | null | undefined): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtDate(d: Date, locale = "ar"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  }).format(d);
}

export function fmtTime(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
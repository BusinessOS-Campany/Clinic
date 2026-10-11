import type { Patient } from "@/lib/generated/prisma/client";

export function displayName(p: Pick<Patient, "firstNameAr" | "lastNameAr" | "firstNameEn" | "lastNameEn">, locale: string) {
  const latin = [p.firstNameEn, p.lastNameEn].filter(Boolean).join(" ");
  const arabic = `${p.firstNameAr} ${p.lastNameAr}`;
  return locale === "ar" ? (arabic || latin) : (latin || arabic);
}

export function initials(p: Pick<Patient, "firstNameAr" | "lastNameAr" | "firstNameEn" | "lastNameEn">) {
  const a = (p.firstNameAr ?? "").trim().charAt(0);
  const b = (p.lastNameAr ?? "").trim().charAt(0);
  return `${a}${b}`;
}

export function calcAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(Date.UTC(birthDate.getUTCFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate()));
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function formatDate(d: Date | null, locale: string): string {
  if (!d) return "";
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utc);
}

export function dateInputFrom(p: Pick<Patient, "birthDate">): string | undefined {
  const d = p.birthDate;
  if (!d) return undefined;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
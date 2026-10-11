"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TriangleAlert } from "lucide-react";
import type { DuplicateCandidate } from "@/lib/patients-duplicates";
import { Button } from "@/components/ui/button";

export function DuplicateWarning({
  candidates,
  blocked,
  onConfirm,
  onDismiss,
  busy,
}: {
  candidates: DuplicateCandidate[];
  blocked: boolean;
  onConfirm?: () => void;
  onDismiss?: () => void;
  busy?: boolean;
}) {
  const t = useTranslations("patients");

  if (candidates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
      <div className="flex items-start gap-2.5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">
            {blocked ? t("duplicateBlockedTitle") : t("duplicateWarningTitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {blocked ? t("duplicateBlockedDesc") : t("duplicateWarningDesc")}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {candidates.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {c.firstNameAr} {c.secondNameAr} {c.lastNameAr}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{c.mrn}</span>
                {c.phone && <span dir="ltr">{c.phone}</span>}
                {c.nationalId && <span dir="ltr">{c.nationalId}</span>}
                <span className="rounded-full bg-muted px-1.5 py-0.5">
                  {c.reasons.map((r) => t(`duplicateReason_${r}`)).join(" · ")}
                </span>
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/patients/${c.id}`} target="_blank">
                {t("openRecord")}
              </Link>
            </Button>
          </li>
        ))}
      </ul>

      {!blocked && (onConfirm || onDismiss) && (
        <div className="flex flex-wrap gap-2">
          {onConfirm && (
            <Button type="button" size="sm" onClick={onConfirm} disabled={busy}>
              {t("createAnyway")}
            </Button>
          )}
          {onDismiss && (
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss} disabled={busy}>
              {t("editExisting")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
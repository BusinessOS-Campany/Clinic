"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  approvePatientMerge,
  applyPatientMerge,
  rejectPatientMerge,
} from "@/app/[locale]/(app)/patients/identity-actions";
import { Button } from "@/components/ui/button";

const ERRORS = [
  "no-clinic",
  "not-found",
  "forbidden",
  "self-approval",
  "already-decided",
  "invalid-selection",
] as const;

export function MergeDecisionButtons({
  requestId,
  status,
  canApprove,
  isRequester,
  primaryMrn,
}: {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "APPLIED";
  canApprove: boolean;
  isRequester: boolean;
  primaryMrn: string;
}) {
  const t = useTranslations("patients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    setBusy(true);
    try {
      const res = await action();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else {
        const key = ERRORS.includes(res.error as (typeof ERRORS)[number])
          ? (res.error as string)
          : "not-found";
        toast.error(t(`mergeError_${key}`));
      }
    } catch {
      toast.error(tc("failed"));
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  if (status === "PENDING") {
    if (!canApprove || isRequester) {
      return (
        <span className="text-xs text-muted-foreground">
          {isRequester ? t("mergeAwaitingApproval") : t("mergeForbidden")}
        </span>
      );
    }
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => run(() => approvePatientMerge(requestId), t("mergeApproved"))}
        >
          {t("approve")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => rejectPatientMerge(requestId), t("mergeRejected"))}
        >
          {t("reject")}
        </Button>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <Button
        size="sm"
        onClick={() => run(() => applyPatientMerge(requestId), t("mergeApplied"))}
      >
        {t("applyMerge", { primary: primaryMrn })}
      </Button>
    );
  }

  return null;
}
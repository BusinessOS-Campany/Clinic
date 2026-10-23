"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { setAppointmentStatus } from "@/app/[locale]/(app)/appointments/actions";
import { Button } from "@/components/ui/button";

const VARIANT: Record<
  string,
  "default" | "destructive" | "outline" | "secondary" | "info" | "success" | "warning"
> = {
  CONFIRMED: "info",
  ARRIVED: "warning",
  IN_SERVICE: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
};

export function AppointmentStatusActions({
  id,
  allowed,
}: {
  id: string;
  allowed: string[];
}) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  if (allowed.length === 0) return null;

  async function run(status: string) {
    setPending(status);
    try {
      const res = await setAppointmentStatus(id, status as never);
      if (res.ok) toast.success(t("statusUpdated"));
      else toast.error(t("statusFailed"));
      router.refresh();
    } catch {
      toast.error(t("statusFailed"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowed.map((s) => (
        <Button
          key={s}
          variant={VARIANT[s] ?? "outline"}
          size="sm"
          onClick={() => run(s)}
          disabled={pending !== null}
        >
          {pending === s ? "…" : t(`status_${s.toLowerCase()}`)}
        </Button>
      ))}
    </div>
  );
}
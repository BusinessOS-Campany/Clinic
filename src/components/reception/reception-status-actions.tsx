"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CircleCheck, Stethoscope, UserCheck, UserX, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { setAppointmentStatus } from "@/app/[locale]/(app)/appointments/actions";
import {
  STATUS_TRANSITIONS,
  type AppointmentStatusValue,
} from "@/app/[locale]/(app)/appointments/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIMARY_VARIANT: Record<string, "default" | "success" | "warning"> = {
  ARRIVED: "warning",
  IN_SERVICE: "default",
  COMPLETED: "success",
};

const MOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CONFIRMED: Check,
  ARRIVED: UserCheck,
  IN_SERVICE: Stethoscope,
  COMPLETED: CircleCheck,
  CANCELLED: X,
  NO_SHOW: UserX,
};

function nextPrimary(
  current: AppointmentStatusValue,
  allowed: AppointmentStatusValue[],
): AppointmentStatusValue | null {
  if (allowed.includes("ARRIVED")) return "ARRIVED";
  if (allowed.includes("IN_SERVICE")) return "IN_SERVICE";
  if (allowed.includes("COMPLETED")) return "COMPLETED";
  return null;
}

export function ReceptionStatusActions({
  id,
  current,
}: {
  id: string;
  current: AppointmentStatusValue;
}) {
  const t = useTranslations("reception");
  const ta = useTranslations("appointments");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const allowed = STATUS_TRANSITIONS[current];
  if (allowed.length === 0) return null;
  const primary = nextPrimary(current, allowed);
  const more = primary ? allowed.filter((s) => s !== primary) : allowed;
  if (!primary) return null;

  async function run(status: AppointmentStatusValue) {
    if (status === "CANCELLED" && !window.confirm(t("confirmCancel"))) return;
    if (status === "NO_SHOW" && !window.confirm(t("confirmNoShow"))) return;
    setPending(true);
    try {
      const res = await setAppointmentStatus(id, status);
      if (res.ok) toast.success(ta("statusUpdated"));
      else toast.error(ta("statusFailed"));
      router.refresh();
    } catch {
      toast.error(ta("statusFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant={PRIMARY_VARIANT[primary] ?? "default"}
        onClick={() => run(primary)}
        disabled={pending}
      >
        {t(`primary_${primary}`)}
      </Button>
      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={pending}>
              …
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {more.map((s) => {
              const Icon = MOR_ICONS[s];
              return (
                <DropdownMenuItem key={s} onSelect={() => run(s)}>
                  {Icon && <Icon className="size-4" />}
                  {ta(`status_${s.toLowerCase()}`)}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
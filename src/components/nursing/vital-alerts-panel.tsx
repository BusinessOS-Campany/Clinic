"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { acknowledgeVitalAlert } from "@/app/[locale]/(app)/nursing/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RosterAlert = {
  id: string;
  patientName: string;
  severity: string;
  message: string;
  value: number;
};

function severityVariant(
  severity: string,
): "info" | "warning" | "destructive" {
  if (severity === "CRITICAL") return "destructive";
  if (severity === "WARNING") return "warning";
  return "info";
}

export function VitalAlertsPanel({ alerts }: { alerts: RosterAlert[] }) {
  const t = useTranslations("vitals");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function acknowledge(id: string) {
    setPendingId(id);
    try {
      const res = await acknowledgeVitalAlert(id);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(tc("failed"));
      }
    } catch {
      toast.error(tc("failed"));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BellRing className="size-4 text-destructive" />
          {t("openAlerts")}
          {alerts.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({alerts.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAlerts")}</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-2 rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{alert.patientName}</span>
                <Badge variant={severityVariant(alert.severity)}>
                  {t(`alertSeverity_${alert.severity}`)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {alert.message}
                <span className="ms-1 font-medium text-foreground tabular-nums">
                  ({alert.value})
                </span>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="self-start"
                disabled={pendingId === alert.id}
                onClick={() => acknowledge(alert.id)}
              >
                {t("acknowledge")}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

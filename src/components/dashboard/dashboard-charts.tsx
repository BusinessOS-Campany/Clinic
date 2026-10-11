"use client";

import { useTranslations } from "next-intl";
import {
  BadgeDollarSign,
  CalendarRange,
  Layers,
  TrendingUp,
  UserPlus,
  Activity,
} from "lucide-react";
import { ChartFrame } from "./charts/chart-kit";
import {
  BreakdownDonut,
  RegistrationsLineChart,
  RevenueAreaChart,
  WeeklyBarsChart,
  type Slice,
} from "./charts/charts";

export type Point = { label: string; value: number };

export function DashboardCharts({
  rev14d,
  appt7d,
  newPatients,
  byStatus,
  byType,
  byMethod,
  labels,
}: {
  rev14d: Point[];
  appt7d: Point[];
  newPatients: Point[];
  byStatus: Slice[];
  byType: Slice[];
  byMethod: Slice[];
  labels: {
    revenueTrend: string;
    appointmentsTrend: string;
    newPatients: string;
    appointmentStatus: string;
    appointmentTypes: string;
    paymentMethods: string;
    noData: string;
  };
}) {
  const t = useTranslations("dashboard");
  const ta = useTranslations("appointments");
  const tb = useTranslations("billing");
  const noData = labels.noData || t("noData");

  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <ChartFrame
        title={labels.revenueTrend}
        icon={<TrendingUp className="size-4" aria-hidden />}
        className="lg:col-span-4"
        index={0}
      >
        <RevenueAreaChart data={rev14d} emptyLabel={noData} />
      </ChartFrame>

      <ChartFrame
        title={labels.paymentMethods}
        icon={<BadgeDollarSign className="size-4" aria-hidden />}
        className="lg:col-span-2"
        index={1}
      >
        <BreakdownDonut data={byMethod} emptyLabel={noData} />
      </ChartFrame>

      <ChartFrame
        title={labels.appointmentsTrend}
        icon={<CalendarRange className="size-4" aria-hidden />}
        className="lg:col-span-2"
        index={2}
      >
        <WeeklyBarsChart data={appt7d} emptyLabel={noData} />
      </ChartFrame>

      <ChartFrame
        title={labels.newPatients}
        icon={<UserPlus className="size-4" aria-hidden />}
        className="lg:col-span-2"
        index={3}
      >
        <RegistrationsLineChart data={newPatients} emptyLabel={noData} />
      </ChartFrame>

      <ChartFrame
        title={labels.appointmentStatus}
        icon={<Activity className="size-4" aria-hidden />}
        className="lg:col-span-2"
        index={4}
      >
        <BreakdownDonut data={byStatus} emptyLabel={noData} />
      </ChartFrame>

      <ChartFrame
        title={labels.appointmentTypes}
        icon={<Layers className="size-4" aria-hidden />}
        className="lg:col-span-6"
        index={5}
      >
        <BreakdownDonut data={byType} emptyLabel={noData} />
      </ChartFrame>
    </div>
  );
}
"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS,
  ChartEmpty,
  ChartLegend,
  ChartTooltip,
  paletteAt,
  useChartMotion,
} from "./chart-kit";
import { fmtInt } from "@/lib/format";

export type Point = { label: string; value: number };
export type Slice = { key: string; label: string; value: number };

/* ------------------------------------------------------------------ */
/* Revenue trend — gradient area                                      */
/* ------------------------------------------------------------------ */

export function RevenueAreaChart({ data, emptyLabel }: { data: Point[]; emptyLabel: string }) {
  const duration = useChartMotion();
  const hasData = data.some((p) => p.value > 0);

  if (!hasData) return <ChartEmpty label={emptyLabel} />;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--border)" tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={AXIS} stroke="var(--border)" tickLine={false} axisLine={false} width={46} />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.35 }}
            content={<ChartTooltip format={fmtInt} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#revFill)"
            animationDuration={duration}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Appointments this week — bars                                       */
/* ------------------------------------------------------------------ */

export function WeeklyBarsChart({ data, emptyLabel }: { data: Point[]; emptyLabel: string }) {
  const duration = useChartMotion();
  if (!data.some((p) => p.value > 0)) return <ChartEmpty label={emptyLabel} />;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--border)" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={AXIS} stroke="var(--border)" tickLine={false} axisLine={false} width={26} />
          <Tooltip
            cursor={{ fill: "var(--primary)", fillOpacity: 0.08 }}
            content={<ChartTooltip format={fmtInt} />}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={duration} animationEasing="ease-out">
            {data.map((_, i) => (
              <Cell key={i} fill="var(--chart-2)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New patients — line                                                 */
/* ------------------------------------------------------------------ */

export function RegistrationsLineChart({ data, emptyLabel }: { data: Point[]; emptyLabel: string }) {
  const duration = useChartMotion();
  if (!data.some((p) => p.value > 0)) return <ChartEmpty label={emptyLabel} />;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="regStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-4)" />
              <stop offset="100%" stopColor="var(--chart-2)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--border)" tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={AXIS} stroke="var(--border)" tickLine={false} axisLine={false} width={26} />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.35 }}
            content={<ChartTooltip format={fmtInt} />}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#regStroke)"
            strokeWidth={2.5}
            animationDuration={duration}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown donut — interactive centre label + custom legend          */
/* ------------------------------------------------------------------ */

export function BreakdownDonut({
  data,
  emptyLabel,
  format,
}: {
  data: Slice[];
  emptyLabel: string;
  format?: (v: number) => string;
}) {
  const duration = useChartMotion();
  const [active, setActive] = useState<number | null>(null);

  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);

  if (!slices.length || total <= 0) return <ChartEmpty label={emptyLabel} />;

  const fmt = format ?? fmtInt;
  const focused = active != null ? slices[active] : null;
  const legendItems = slices.map((s, i) => ({
    key: s.key,
    label: s.label,
    value: s.value,
    color: paletteAt(i),
  }));

  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
      <div className="relative h-44 w-full shrink-0 sm:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="key"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              animationDuration={duration}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {slices.map((_, i) => (
                <Cell
                  key={i}
                  fill={paletteAt(i)}
                  opacity={active == null || active === i ? 1 : 0.32}
                  style={{ transition: "opacity 220ms ease" }}
                />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  hideLabel
                  format={(v) => fmt(v)}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums" dir="ltr">
            {fmt(focused ? focused.value : total)}
          </span>
          <span className="max-w-24 truncate text-[10px] text-muted-foreground">
            {focused ? focused.label : ""}
          </span>
        </div>
      </div>

      <ChartLegend items={legendItems} className="w-full min-w-0 flex-1 sm:mt-0" />
    </div>
  );
}
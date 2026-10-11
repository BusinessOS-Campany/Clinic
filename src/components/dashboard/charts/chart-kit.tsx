"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
] as const;

export function paletteAt(index: number): string {
  return PALETTE[index % PALETTE.length] ?? PALETTE[0];
}

export const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

/** Animation duration in ms, or 0 when the user prefers reduced motion. */
export function useChartMotion() {
  const reduce = useReducedMotion();
  return reduce ? 0 : 1100;
}

export type TooltipEntry = { name?: string; value?: number | string; color?: string; dataKey?: string };

export function ChartTooltip({
  active,
  payload,
  label,
  format,
  hideLabel = false,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  format: (v: number, entry: TooltipEntry) => string;
  hideLabel?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      {!hideLabel && label != null && <p className="mb-1 font-medium">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const raw = entry.value ?? 0;
          const numeric = typeof raw === "number" ? raw : Number(raw);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
              <span className="font-semibold tabular-nums" dir="ltr">
                {format(numeric, entry)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartFrame({
  title,
  icon,
  children,
  className,
  index = 0,
  delay = 0.35,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  index?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay + index * 0.06, ease: EASE }}
      className={className}
    >
      <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="truncate text-sm font-semibold">{title}</CardTitle>
          {icon && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </span>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export function ChartEmpty({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground", className)}>
      <svg viewBox="0 0 120 44" className="h-11 w-32" fill="none" aria-hidden>
        <path
          d="M2 38 L26 30 L50 34 L74 18 L98 24 L118 8"
          stroke="var(--border)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Custom legend with values, rendered outside the SVG so it can be fully styled. */
export function ChartLegend({
  items,
  className,
}: {
  items: { key: string; label: string; value: number; color: string }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <ul className={cn("mt-4 flex flex-col gap-2", className)}>
      {items.map((item, i) => (
        <motion.li
          key={item.key}
          initial={reduce ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.05, ease: EASE }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
          <span className="shrink-0 font-medium tabular-nums" dir="ltr">
            {item.value.toLocaleString()}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}
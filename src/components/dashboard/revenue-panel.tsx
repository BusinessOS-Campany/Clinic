"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WeeklyBarsChart, type Point } from "./charts/charts";

const TABS = ["ALL", "1M", "6M"] as const;
type Tab = (typeof TABS)[number];

export type SummaryItem = {
  label: string;
  value: string;
  color: string;
};

export function RevenuePanel({
  title,
  monthly,
  summaries,
  noData,
}: {
  title: string;
  monthly: Point[];
  summaries: SummaryItem[];
  noData: string;
}) {
  const [tab, setTab] = useState<Tab>("ALL");

  const data =
    tab === "1M" ? monthly.slice(-1) : tab === "6M" ? monthly.slice(-6) : monthly;

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="truncate text-sm font-semibold">{title}</CardTitle>
        <div className="flex gap-1">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              dir="ltr"
            >
              {key}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {summaries.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-2 text-center"
              style={{ background: `color-mix(in srgb, ${s.color} 8%, transparent)` }}
            >
              <p className="truncate text-[11px] text-muted-foreground">{s.label}</p>
              <p
                className="truncate text-sm font-bold tabular-nums"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <WeeklyBarsChart data={data} emptyLabel={noData} />
      </CardContent>
    </Card>
  );
}

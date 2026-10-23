"use client";

import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { CalendarClock, ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type QueueItem = {
  id: string;
  name: string;
  time: string;
  status: "WAITING" | "IN_SERVICE" | "UPCOMING";
  meta?: string;
};

const STATUS_STYLE = {
  WAITING: { label: "waiting", tone: "var(--warning)", bg: "var(--warning)" },
  IN_SERVICE: { label: "inService", tone: "var(--success)", bg: "var(--success)" },
  UPCOMING: { label: "upcoming", tone: "var(--info)", bg: "var(--info)" },
} as const;

export function LiveQueue({
  items,
  labels,
}: {
  items: QueueItem[];
  labels: {
    title: string;
    empty: string;
    viewAll: string;
    status: { waiting: string; inService: string; upcoming: string };
  };
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.44, ease: EASE }}
      className="w-full"
    >
      <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            {labels.title}
          </CardTitle>
          <Link
            href="/reception"
            className="group flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {labels.viewAll}
            <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </CardHeader>

        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
              <Inbox className="size-8 opacity-40" aria-hidden />
              <p className="text-sm">{labels.empty}</p>
            </div>
          ) : (
            <ul className="grid gap-1.5 md:grid-cols-2">
              {items.map((item, i) => {
                const style = STATUS_STYLE[item.status];
                const initials = item.name.trim().slice(0, 2);
                return (
                  <motion.li
                    key={item.id}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.5 + i * 0.05, ease: EASE }}
                  >
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border border-transparent p-2",
                        "transition-all duration-250",
                        "hover:border-border hover:bg-accent/50",
                      )}
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: `color-mix(in srgb, ${style.tone} 16%, transparent)`,
                          color: style.tone,
                        }}
                      >
                        {initials}
                      </span>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{item.name}</span>
                        {item.meta && (
                          <span className="truncate text-xs text-muted-foreground">{item.meta}</span>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                          <CalendarClock className="size-3" aria-hidden />
                          <span dir="ltr">{item.time}</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="border-transparent px-1.5 py-0 text-[10px]"
                          style={{
                            background: `color-mix(in srgb, ${style.bg} 14%, transparent)`,
                            color: style.tone,
                          }}
                        >
                          {labels.status[style.label]}
                        </Badge>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
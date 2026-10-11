"use client";

import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarPlus,
  ChartNoAxesColumn,
  ClipboardList,
  FlaskConical,
  Pill,
  Receipt,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type QuickActionIcon =
  | "userPlus"
  | "calendarPlus"
  | "clipboard"
  | "arrowRight"
  | "stethoscope"
  | "receipt"
  | "flask"
  | "pill"
  | "chartBar";

export type QuickActionTone = "primary" | "info" | "success" | "warning" | "violet";

export type QuickAction = {
  label: string;
  href: string;
  icon: QuickActionIcon;
  tone?: QuickActionTone;
};

const ICONS = {
  userPlus: UserPlus,
  calendarPlus: CalendarPlus,
  clipboard: ClipboardList,
  arrowRight: ArrowRight,
  stethoscope: Stethoscope,
  receipt: Receipt,
  flask: FlaskConical,
  pill: Pill,
  chartBar: ChartNoAxesColumn,
} as const;

const TONE: Record<QuickActionTone, string> = {
  primary: "var(--primary)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  violet: "var(--chart-4)",
} as const;

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {actions.map((a, i) => {
        const Icon = ICONS[a.icon];
        const accent = TONE[a.tone ?? "primary"];
        return (
          <motion.div
            key={a.href + a.label}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 + i * 0.06, ease: EASE }}
          >
            <Link
              href={a.href}
              style={{ "--qa-accent": accent } as React.CSSProperties}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-3.5",
                "transition-all duration-300",
                "hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--qa-accent)_45%,var(--border))]",
                "hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--qa-accent)_12%,transparent)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: "color-mix(in srgb, var(--qa-accent) 13%, transparent)",
                  color: "var(--qa-accent)",
                }}
              >
                <Icon className="size-5" aria-hidden />
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{a.label}</span>
              </span>

              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--qa-accent)] rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />

              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -start-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:animate-none group-hover:opacity-100 group-hover:[animation:auth-sheen_0.9s_ease-out]"
              />
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
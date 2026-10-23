"use client";

import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function DashboardHero({
  greeting,
  userName,
  subtitle,
  pendingOrders,
  pendingOrdersLabel,
  action,
}: {
  greeting: string;
  userName: string;
  subtitle: string;
  pendingOrders: number;
  pendingOrdersLabel: string;
  action?: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="group relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6"
    >
      {/* animated aurora wash */}
      <div className="auth-aurora" aria-hidden>
        <div className="auth-orb auth-orb-a -top-24 end-[-6%] size-72 bg-primary/20" />
        <div className="auth-orb auth-orb-b top-0 start-[35%] size-64 bg-info/15" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,var(--primary)/0.12,transparent)]"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <motion.span
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
          >
            <Sparkles className="size-3" aria-hidden />
            {greeting}
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: EASE }}
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {userName}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            className="text-sm text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.26, ease: EASE }}
          className="flex items-center gap-2"
        >
          {action}
        </motion.div>
      </div>

      {pendingOrders > 0 && (
        <span className="sr-only">
          {pendingOrdersLabel}: {pendingOrders}
        </span>
      )}
    </motion.div>
  );
}
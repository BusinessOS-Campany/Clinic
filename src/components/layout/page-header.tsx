import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
  icon,
  breadcrumb,
  sticky = false,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  breadcrumb?: React.ReactNode;
  sticky?: boolean;
}) {
  const Icon = icon;
  return (
    <div
      className={cn(
        "section-enter flex flex-col gap-3",
        sticky && "sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-3 border-b border-border/50",
        className,
      )}
    >
      {breadcrumb && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
          {breadcrumb}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="relative flex size-10 items-center justify-center rounded-xl">
              <span
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 opacity-60 animate-pulse"
                aria-hidden
              />
              <span className="relative flex size-10 items-center justify-center rounded-xl border bg-card shadow-sm">
                <Icon className="size-5 text-primary" aria-hidden />
              </span>
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
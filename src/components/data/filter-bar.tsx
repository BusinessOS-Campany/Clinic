import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Shared filter pill row. Replaces the duplicated
 * `Button asChild + variant={active ? "default" : "outline"}` pattern that was
 * copy-pasted across six list pages.
 */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterPill({
  href,
  active,
  children,
  count,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
      {count != null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[10px] tabular-nums transition-colors",
            active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
          )}
          dir="ltr"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
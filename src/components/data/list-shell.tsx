import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ListColumn = {
  label: string;
  className: string;
};

/** Cap the stagger so long lists never feel slow to become readable. */
const STAGGER_LIMIT = 14;

export function staggerDelay(index: number): React.CSSProperties {
  if (index >= STAGGER_LIMIT) return {};
  return { animationDelay: `${60 + index * 35}ms` };
}

/**
 * The list shell used by every "collection" page. Replaces the eight
 * hand-rolled `overflow-hidden rounded-xl border bg-card` + fake
 * `hidden grid-cols-[…]` header combinations.
 *
 * Stays a server component — the entrance animation is pure CSS.
 */
export function ListShell({
  children,
  columns,
  className,
  bodyClassName,
}: {
  children: ReactNode;
  /** Optional sticky header row, aligned to the same grid as the rows. */
  columns?: ListColumn[];
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-300",
        "hover:shadow-md hover:shadow-primary/5",
        className,
      )}
    >
      {columns && columns.length > 0 && (
        <div
          className={cn(
            "sticky top-0 z-10 grid gap-3 border-b bg-card/95 px-4 py-2.5",
            "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur",
            gridClass(columns),
          )}
        >
          {columns.map((c) => (
            <span key={c.label} className={cn("truncate", c.className)}>
              {c.label}
            </span>
          ))}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function gridClass(columns: ListColumn[]): string {
  // Use the first column's layout as the grid definition for the whole shell.
  const first = columns[0]?.className ?? "";
  const match = /grid-cols-\[([^\]]+)\]/.exec(first);
  if (match?.[1]) return `grid-cols-[${match[1]}]`;
  return "grid-cols-1";
}

/** A single row inside a `ListShell`, with the shared hover treatment. */
export function ListRow({
  children,
  href,
  className,
  index,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  index: number;
}) {
  const classes = cn(
    "row-enter flex items-center gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0",
    "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none",
    href && "cursor-pointer",
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        style={staggerDelay(index)}
        className={cn(classes, "hover:border-l-2 hover:border-l-primary hover:ps-[calc(1rem-2px)] transition-[background-color,border-color,padding] duration-200")}
      >
        {children}
      </a>
    );
  }

  return (
    <div style={staggerDelay(index)} className={classes}>
      {children}
    </div>
  );
}

/** Grid-aligned row for shells that declare `columns`. */
export function ListGridRow({
  children,
  href,
  className,
  index,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
  index: number;
}) {
  const classes = cn(
    "row-enter grid items-center gap-3 border-b px-4 py-3 text-sm transition-colors last:border-b-0",
    "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none",
    href && "cursor-pointer",
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        style={staggerDelay(index)}
        className={cn(classes, "hover:shadow-[inset_2px_0_0_0_var(--primary)]")}
      >
        {children}
      </a>
    );
  }

  return (
    <div style={staggerDelay(index)} className={classes}>
      {children}
    </div>
  );
}
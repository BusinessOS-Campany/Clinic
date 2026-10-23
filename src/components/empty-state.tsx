import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "section-enter flex min-h-56 flex-col items-center justify-center gap-3",
        "rounded-xl border border-dashed bg-card/50 p-8 text-center",
        className,
      )}
    >
      <div className="relative flex size-14 items-center justify-center rounded-full bg-muted/50">
        {Icon && <Icon className="size-7 text-muted-foreground" aria-hidden />}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-lg">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-[24ch]">{description}</p>
        )}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
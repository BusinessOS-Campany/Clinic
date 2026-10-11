import type { VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export function ProfileSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  if (!title) return <div className={className}>{children}</div>;
  return (
    <Card className={className}>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ProfileEmpty({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export type ProfileFact = { label: string; value: string };

export type ProfileRecord = {
  id: string;
  title: string;
  subtitle?: string | null;
  badges?: { label: string; variant?: BadgeVariant }[];
  facts?: ProfileFact[];
  note?: string | null;
  trailing?: React.ReactNode;
  actions?: React.ReactNode;
};

export function ProfileRecordList({ records }: { records: ProfileRecord[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {records.map((record, index) => {
        const body = (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{record.title}</span>
                {record.badges?.map((badge) => (
                  <Badge key={badge.label} variant={badge.variant ?? "secondary"}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
              {record.subtitle && (
                <span className="text-xs text-muted-foreground">
                  {record.subtitle}
                </span>
              )}
              {record.facts && record.facts.length > 0 && (
                <dl className="flex flex-wrap gap-x-5 gap-y-1 pt-0.5">
                  {record.facts.map((fact) => (
                    <div key={fact.label} className="flex items-baseline gap-1.5">
                      <dt className="text-xs text-muted-foreground">
                        {fact.label}
                      </dt>
                      <dd className="text-xs font-medium">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {record.note && (
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {record.note}
                </p>
              )}
            </div>
            {record.trailing && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {record.trailing}
              </span>
            )}
            {record.actions && (
              <div className="flex items-center gap-1">{record.actions}</div>
            )}
          </>
        );

        return (
          <div
            key={record.id}
            className={cn(
              "flex items-start gap-3 px-3 py-3",
              index < records.length - 1 && "border-b",
            )}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}
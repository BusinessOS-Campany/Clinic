import { getTranslations } from "next-intl/server";
import { History } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { displayName, initials } from "@/lib/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RecentlyViewedItem = {
  id: string;
  mrn: string;
  firstNameAr: string;
  secondNameAr: string | null;
  lastNameAr: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  phone: string | null;
  viewedAt: string;
};

export async function RecentlyViewed({
  items,
  locale,
}: {
  items: RecentlyViewedItem[];
  locale: string;
}) {
  const t = await getTranslations("patients");

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="px-6">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4 text-muted-foreground" aria-hidden />
          {t("recentlyViewed")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/patients/${p.id}`}
            className="flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-accent"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(p)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {displayName(p, locale)}
              </span>
              <span className="block font-mono text-[11px] text-muted-foreground">
                {p.mrn}
              </span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
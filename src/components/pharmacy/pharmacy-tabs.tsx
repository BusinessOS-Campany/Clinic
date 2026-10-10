import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "dispensing", href: "/pharmacy" },
  { key: "prescriptions", href: "/pharmacy/prescriptions" },
  { key: "medications", href: "/pharmacy/medications" },
  { key: "interactions", href: "/pharmacy/interactions" },
] as const;

export async function PharmacyTabs({
  active,
}: {
  active: "dispensing" | "prescriptions" | "medications" | "interactions";
}) {
  const t = await getTranslations("pharmacy");
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            active === tab.key
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`tab_${tab.key}`)}
        </Link>
      ))}
    </div>
  );
}

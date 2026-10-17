"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { navGroups } from "./nav";
import { NAV_ICONS } from "./nav-icons";

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("nav");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const flat = navGroups.flatMap((g) =>
      g.items.flatMap((i) =>
        i.href
          ? [{ ...i, group: g.key }]
          : (i.children ?? []).map((c) => ({ ...c, group: g.key })),
      ),
    );
    if (!q) return flat;
    return flat.filter((i) => t(i.key).toLowerCase().includes(q));
  }, [query, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[20%] translate-y-0 rtl:translate-x-[-50%] max-w-lg gap-0 p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("globalSearch")}</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("globalSearch")}
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("dashboard")}
            </p>
          )}
          {results.map((item) => {
            const Icon = item.iconKey ? NAV_ICONS[item.iconKey] : undefined;
            return (
              <Link
                key={item.key}
                href={item.href as any}
                onClick={() => {
                  setQuery("");
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {Icon ? (
                  <Icon className="size-4 shrink-0" aria-hidden />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
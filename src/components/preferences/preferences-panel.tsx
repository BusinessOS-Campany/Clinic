"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  useAppPreferences,
  type Accent,
  type Density,
} from "@/components/providers/app-preferences";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const accents: { key: Accent; labelKey: string; color: string }[] = [
  { key: "teal", labelKey: "accentTeal", color: "#0e7c74" },
  { key: "ocean", labelKey: "accentOcean", color: "#2563eb" },
  { key: "sage", labelKey: "accentSage", color: "#4d7c0f" },
  { key: "plum", labelKey: "accentPlum", color: "#7c3aed" },
  { key: "gold", labelKey: "accentGold", color: "#b45309" },
];

export function PreferencesPanel() {
  const t = useTranslations("appearance");
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, density, setDensity, sidebarCollapsed, setSidebarCollapsed } =
    useAppPreferences();
  const router = useRouter();
  const pathname = usePathname();

  function changeLanguage(locale: "ar" | "en") {
    router.replace(pathname, { locale });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("theme")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map((m) => (
            <Button
              key={m}
              variant={theme === m ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(m)}
            >
              {t(m === "light" ? "themeLight" : m === "dark" ? "themeDark" : "themeSystem")}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("accent")}</h3>
        <div className="flex gap-2">
          {accents.map((a) => (
            <button
              key={a.key}
              type="button"
              aria-label={t(a.labelKey)}
              onClick={() => setAccent(a.key)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                accent === a.key ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: a.color }}
            >
              {accent === a.key && <Check className="size-4 text-white" />}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("density")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["comfortable", "compact"] as const).map((d) => (
            <Button
              key={d}
              variant={density === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDensity(d)}
            >
              {t(d === "comfortable" ? "densityComfortable" : "densityCompact")}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("language")}</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeLanguage("ar")}
          >
            العربية
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeLanguage("en")}
          >
            English
          </Button>
        </div>
      </section>

      <Separator />

      <section className="flex items-center justify-between gap-3">
        <Label htmlFor="sidebar-collapsed">{t("sidebarCollapsed")}</Label>
        <Switch
          id="sidebar-collapsed"
          checked={sidebarCollapsed}
          onCheckedChange={setSidebarCollapsed}
        />
      </section>
    </div>
  );
}
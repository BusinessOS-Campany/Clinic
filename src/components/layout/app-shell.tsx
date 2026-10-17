"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppPreferences } from "@/components/providers/app-preferences";
import type { NavGroup } from "./nav";
import type { SessionUser } from "@/core/auth/session";
import { SidebarContent } from "./sidebar-content";
import { Header } from "./header";

export function AppShell({
  children,
  groups,
  user,
}: {
  children: React.ReactNode;
  groups: NavGroup[];
  user: SessionUser;
}) {
  const { sidebarCollapsed } = useAppPreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("common");

  const drawerSide = locale === "ar" ? "right" : "left";

  return (
    <div className="flex min-h-svh bg-background">
      <aside
        data-collapsed={sidebarCollapsed}
        className="sticky top-0 hidden h-svh shrink-0 overflow-hidden border-e border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out lg:block print:hidden"
        style={{ width: sidebarCollapsed ? "4.5rem" : "17rem" }}
      >
        <SidebarContent groups={groups} collapsed={sidebarCollapsed} user={user} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={drawerSide}
          className="w-[17rem] max-w-[85vw] gap-0 border-sidebar-border bg-sidebar p-0 sm:max-w-[17rem] md:max-w-[17rem] lg:max-w-[17rem]"
        >
          <SheetTitle className="sr-only">{t("appName")}</SheetTitle>
          <SidebarContent
            groups={groups}
            user={user}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

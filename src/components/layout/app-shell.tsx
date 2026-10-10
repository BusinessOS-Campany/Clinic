"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  return (
    <div className="flex min-h-svh">
      <aside
        data-collapsed={sidebarCollapsed}
        className="sticky top-0 hidden h-svh w-16 shrink-0 border-e border-sidebar-border transition-[width] duration-200 lg:block"
        style={{ width: sidebarCollapsed ? "4rem" : "16rem" }}
      >
        <SidebarContent
          groups={groups}
          collapsed={sidebarCollapsed}
          user={user}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-e border-sidebar-border bg-sidebar p-0">
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
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  ChevronsUpDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/app-preferences";
import { signOut } from "@/core/auth/client";
import type { SessionUser } from "@/core/auth/session";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandMenu } from "./command-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { findNavKey } from "./nav";

export function Header({
  user,
  onMenuClick,
}: {
  user: SessionUser;
  onMenuClick: () => void;
}) {
  const t = useTranslations("nav");
  const tu = useTranslations("user");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const rtl = locale === "ar";
  const { sidebarCollapsed, setSidebarCollapsed } = useAppPreferences();
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const currentKey = findNavKey(pathname ?? "/");

  const initials = useMemo(() => {
    const parts = (user.name || "?").trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? "?";
    const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
    return `${first}${last}`.toUpperCase();
  }, [user.name]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackURL: "/login" });
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur print:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label={t("openMenu")}
      >
        <Menu className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")}
      >
        {sidebarCollapsed ? (
          rtl ? (
            <PanelRightOpen className="size-5" />
          ) : (
            <PanelLeftOpen className="size-5" />
          )
        ) : rtl ? (
          <PanelRightClose className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>

      <Breadcrumb className="hidden sm:block lg:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t("dashboard")}</BreadcrumbLink>
          </BreadcrumbItem>
          {currentKey && currentKey !== "dashboard" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t(currentKey)}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile breadcrumb - simplified */}
      <Breadcrumb className="block min-w-0 flex-1 sm:hidden">
        <BreadcrumbList className="overflow-x-auto flex gap-1 pb-1">
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="px-2 py-1 text-sm">{t("dashboard")}</BreadcrumbLink>
          </BreadcrumbItem>
          {currentKey && currentKey !== "dashboard" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="px-2 py-1 text-sm truncate max-w-[150px]">{t(currentKey)}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        onClick={() => setSearchOpen(true)}
        aria-label={t("globalSearch")}
      >
        <Search className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 justify-start text-muted-foreground sm:inline-flex sm:w-52 md:w-64"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="size-4" />
        <span>{t("globalSearch")}</span>
        <kbd className="ms-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </Button>

      <ThemeSwitcher />

      <LocaleSwitcher />

      <NotificationBell />

      <Separator orientation="vertical" className="mx-1 h-6 hidden sm:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 text-start md:block">
              <span className="block max-w-36 truncate text-sm font-medium">
                {user.name}
              </span>
              <span className="block max-w-36 truncate text-xs text-muted-foreground">
                {tu(`role_${user.roleCode ?? "unknown"}`)}
              </span>
            </span>
            <ChevronsUpDown className="hidden size-4 text-muted-foreground md:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full sm:w-56 md:w-64">
          <DropdownMenuLabel>
            <span className="block truncate">{user.username || user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings" className={cn("flex items-center gap-2")}>
              <Settings className="size-4" /> {tc("settings")}
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              void handleSignOut();
            }}
            disabled={signingOut}
          >
            <LogOut className="size-4" /> {tc("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useAppPreferences } from "@/components/providers/app-preferences";
import { useTheme } from "@/components/providers/theme-provider";
import { signOut } from "@/core/auth/client";
import type { SessionUser } from "@/core/auth/session";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { findNavHref } from "./nav";

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
  const { resolvedTheme, setTheme } = useTheme();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppPreferences();
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const currentHref = findNavHref(pathname ?? "/");

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
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
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>

      <Breadcrumb className="hidden sm:block lg:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t("dashboard")}</BreadcrumbLink>
          </BreadcrumbItem>
          {currentHref && currentHref !== "/" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t(currentHref.slice(1))}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile breadcrumb - simplified */}
      <Breadcrumb className="block sm:hidden flex-1">
        <BreadcrumbList className="overflow-x-auto flex gap-1 pb-1">
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="px-2 py-1 text-sm">{t("dashboard")}</BreadcrumbLink>
          </BreadcrumbItem>
          {currentHref && currentHref !== "/" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="px-2 py-1 text-sm truncate max-w-[150px]">{t(currentHref.slice(1))}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground w-full sm:w-56 md:w-64 justify-start"
        onClick={() => setSearchOpen(true)}
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">{t("globalSearch")}</span>
        <kbd className="ms-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label={tc("save")}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={t("notifications")}>
            <Bell className="size-5" />
            <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full sm:w-80 md:w-96">
          <DropdownMenuLabel className="text-center">{t("notifications")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="flex h-24 items-center justify-center">
            <p className="text-sm text-muted-foreground">{tc("empty")}</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

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
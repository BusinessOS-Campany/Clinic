"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NavGroup } from "./nav";
import { NAV_ICONS } from "./nav-icons";
import type { SessionUser } from "@/core/auth/session";

export function SidebarContent({
  groups,
  collapsed = false,
  user,
  onNavigate,
  footer,
}: {
  groups: NavGroup[];
  collapsed?: boolean;
  user: SessionUser;
  onNavigate?: () => void;
  footer?: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const rtl = locale === "ar";
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const initials =
    (user.name || "?")
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4",
            collapsed && "justify-center px-0",
          )}
        >
          <BrandMark className="bg-sidebar-primary text-sidebar-primary-foreground shadow-md" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight">
                {tc("appName")}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/55">
                {t("clinic")}
              </p>
            </div>
          )}
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.key} className="space-y-1.5">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/40 uppercase">
                    {t(group.key)}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.iconKey ? NAV_ICONS[item.iconKey] : undefined;

                    if (item.children?.length) {
                      const childActive = item.children.some(
                        (child) => child.href && isActive(child.href),
                      );
                      const firstChildHref =
                        item.children.find((child) => child.href)?.href ?? "/";
                      const open = expanded[item.key] ?? childActive;

                      if (collapsed) {
                        const collapsedLink = (
                          <Link
                            href={firstChildHref as any}
                            onClick={onNavigate}
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium outline-none transition-all duration-150",
                              "justify-center px-0",
                              childActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
                            )}
                          >
                            {Icon && (
                              <Icon
                                className={cn(
                                  "size-[18px] shrink-0 transition-colors",
                                  childActive
                                    ? "text-sidebar-primary"
                                    : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
                                )}
                                aria-hidden
                              />
                            )}
                          </Link>
                        );
                        return (
                          <li key={item.key}>
                            <Tooltip>
                              <TooltipTrigger asChild>{collapsedLink}</TooltipTrigger>
                              <TooltipContent
                                side={rtl ? "left" : "right"}
                                className="font-medium"
                              >
                                {t(item.key)}
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        );
                      }

                      return (
                        <li key={item.key}>
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((state) => ({
                                ...state,
                                [item.key]: !open,
                              }))
                            }
                            aria-expanded={open}
                            className={cn(
                              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-all duration-150",
                              childActive
                                ? "text-sidebar-foreground"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
                            )}
                          >
                            {Icon && (
                              <Icon
                                className={cn(
                                  "size-[18px] shrink-0 transition-colors",
                                  childActive
                                    ? "text-sidebar-primary"
                                    : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
                                )}
                                aria-hidden
                              />
                            )}
                            <span className="truncate">{t(item.key)}</span>
                            <ChevronDown
                              className={cn(
                                "ms-auto size-4 shrink-0 opacity-60 transition-transform duration-200",
                                open && "rotate-180",
                              )}
                              aria-hidden
                            />
                          </button>
                          {open && (
                            <ul className="relative mt-0.5 space-y-0.5 ps-6">
                              <span
                                className="absolute inset-y-1 start-3 w-px bg-sidebar-border"
                                aria-hidden
                              />
                              {item.children.map((child) => {
                                const childIsActive = child.href
                                  ? isActive(child.href)
                                  : false;
                                return (
                                  <li key={child.key}>
                                    <Link
                                      href={child.href as any}
                                      onClick={onNavigate}
                                      aria-current={childIsActive ? "page" : undefined}
                                      className={cn(
                                        "block rounded-md px-3 py-1.5 text-sm outline-none transition-colors",
                                        childIsActive
                                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground",
                                      )}
                                    >
                                      {t(child.key)}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    const active = isActive(item.href as string);
                    const link = (
                      <Link
                        href={item.href as any}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium outline-none transition-all duration-150",
                          collapsed ? "justify-center px-0" : "px-3",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute inset-y-1.5 start-0 w-1 rounded-full bg-sidebar-primary transition-opacity",
                            active ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden
                        />
                        {Icon && (
                          <Icon
                            className={cn(
                              "size-[18px] shrink-0 transition-colors",
                              active
                                ? "text-sidebar-primary"
                                : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
                            )}
                            aria-hidden
                          />
                        )}
                        {!collapsed && <span className="truncate">{t(item.key)}</span>}
                      </Link>
                    );
                    return (
                      <li key={item.key}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent
                              side={rtl ? "left" : "right"}
                              className="font-medium"
                            >
                              {t(item.key)}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border p-3",
            collapsed && "px-2",
          )}
        >
          {footer}
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-lg bg-sidebar-accent/40 px-2 py-2",
              collapsed && "justify-center bg-transparent px-0",
            )}
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{user.name}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/50">
                  {user.email || user.username}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

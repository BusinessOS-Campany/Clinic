"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Check, ChevronRight, Filter, Clock, AlertCircle, CheckCircle2, Mail, MessageSquare, Smartphone, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type Notification = {
  id: string;
  category: string;
  channel: string;
  priority: string;
  status: string;
  subject?: string | null;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
};

type FilterType = "all" | "unread" | "today" | "week";

const EASE = [0.16, 1, 0.3, 1] as const;

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  APPOINTMENT_CONFIRMATION: Clock,
  APPOINTMENT_REMINDER: Clock,
  APPOINTMENT_CHANGE: Clock,
  FOLLOW_UP_REMINDER: Clock,
  LAB_RESULT: AlertCircle,
  PRESCRIPTION_READY: MessageSquare,
  PAYMENT_RECEIPT: CheckCircle2,
  BALANCE_REMINDER: AlertCircle,
  CLINIC_ANNOUNCEMENT: Mail,
  STAFF_TASK: Smartphone,
  CUSTOM: Wifi,
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  NORMAL: "bg-primary/10 text-primary",
  HIGH: "bg-warning/10 text-warning",
  URGENT: "bg-destructive/10 text-destructive",
  CRITICAL: "bg-destructive text-destructive-foreground",
};

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  IN_APP: MessageSquare,
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: Wifi,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "today" | "week">("all");
  const [locale, setLocale] = useState<"ar" | "en">("ar");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const res = await fetch(`/api/notifications?limit=50`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.readAt).length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.readAt;
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(n.createdAt) >= today;
    }
    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.createdAt) >= weekAgo;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || Mail;
    return <Icon className="size-4" aria-hidden />;
  };

  const getChannelIcon = (channel: string) => {
    const Icon = CHANNEL_ICONS[channel] || MessageSquare;
    return <Icon className="size-3" aria-hidden />;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const localeObj = locale === "ar" ? ar : enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale: localeObj });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={unreadCount > 0 ? "default" : "ghost"}
          size="icon"
          className={cn("relative", unreadCount > 0 && "bg-primary/10 text-primary")}
          aria-label="Notifications"
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[60vh] overflow-hidden"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Filter tabs */}
        <div className="flex gap-1 px-2 py-1 border-b">
          {(["all", "unread", "today", "week"] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 px-2 py-1 text-xs rounded-md transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {f === "all" && "All"}
              {f === "unread" && `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
              {f === "today" && "Today"}
              {f === "week" && "This Week"}
            </button>
          ))}
        </div>

        <Separator />

        {/* Notifications list */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Mail className="size-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </motion.div>
          ) : (
            <ScrollArea className="h-[400px]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-1 p-2"
              >
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05, ease: EASE }}
                    className={cn(
                      "relative flex items-start gap-3 p-3 rounded-lg transition-colors",
                      !notification.readAt ? "bg-primary/5 border border-primary/10" : "hover:bg-accent/30"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={cn("rounded-full p-1.5", PRIORITY_STYLES[notification.priority])}>
                        {getCategoryIcon(notification.category)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium", !notification.readAt ? "font-semibold" : "")}>
                          {notification.subject || notification.body.substring(0, 50) + "..."}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(notification.createdAt), "HH:mm", { locale: locale === "ar" ? ar : enUS })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getChannelIcon(notification.channel)}
                          {notification.channel}
                        </span>
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(notification.category)}
                          {notification.category.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                    </div>
                    {!notification.readAt && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markAsRead(notification.id)}
                        className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label="Mark as read"
                      >
                        <Check className="size-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </ScrollArea>
          )}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function format(date: Date, formatStr: string, options: { locale: any }) {
  // Simplified formatting - in production use date-fns format
  if (formatStr === "HH:mm") {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return date.toLocaleString("en-US");
}
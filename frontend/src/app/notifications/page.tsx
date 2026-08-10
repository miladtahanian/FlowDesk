"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { toast } from "sonner";
import { Bell, CheckCheck, Filter } from "lucide-react";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);

  const filteredNotifications = (notifications || []).filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      await markRead.mutateAsync([id]);
    } catch {
      toast.error(t("common.failed"));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success(t("notifications.markedAllRead"));
    } catch {
      toast.error(t("common.failed"));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "📋";
      case "task_completed":
        return "✅";
      case "project_invitation":
        return "📨";
      case "comment_added":
        return "💬";
      case "mention":
        return "@";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return t("notifications.justNow");
    if (diffMin < 60) return t("notifications.minutesAgo", { count: diffMin });
    if (diffHr < 24) return t("notifications.hoursAgo", { count: diffHr });
    if (diffDay < 7) return t("notifications.daysAgo", { count: diffDay });
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t("notifications.title")}</h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount ? t("notifications.unreadCount", { count: unreadCount }) : t("notifications.allCaughtUp")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFilter(filter === "all" ? "unread" : "all")}>
                <Filter size={16} className="mr-2" />
                {filter === "all" ? t("notifications.showUnread") : t("notifications.showAll")}
              </Button>
              <Button onClick={handleMarkAllRead} disabled={!unreadCount || markAllRead.isPending}>
                <CheckCheck size={16} className="mr-2" />
                {t("notifications.markAllRead")}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "unread" ? t("notifications.noUnread") : t("notifications.noNotifications")}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs">
                                {t("notifications.new")}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        {notification.entity_type && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("notifications.relatedTo")}: {notification.entity_type}
                          </p>
                        )}
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="shrink-0"
                        >
                          {t("notifications.markRead")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

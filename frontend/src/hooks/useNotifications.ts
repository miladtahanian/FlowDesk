"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Notification, ActivityLog } from "@/types";

export function useNotifications(skip = 0, limit = 50) {
  return useQuery({
    queryKey: ["notifications", skip, limit],
    queryFn: async () => {
      const res = await api.get("/activity/notifications", { params: { skip, limit } });
      return res.data as Notification[];
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await api.get("/activity/notifications/unread-count");
      return res.data.count as number;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      await api.put("/activity/notifications/read", { notification_ids: notificationIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.put("/activity/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useActivityLogs(skip = 0, limit = 50) {
  return useQuery({
    queryKey: ["activity-logs", skip, limit],
    queryFn: async () => {
      const res = await api.get("/activity/logs", { params: { skip, limit } });
      return res.data as ActivityLog[];
    },
  });
}

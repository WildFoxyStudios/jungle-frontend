"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "@/lib/api-notifications";
import {
  useRealtime,
  type WsNotificationEvent,
} from "@/contexts/RealtimeContext";
import { useAuth } from "@/contexts/AuthContext";
import { parseError } from "@/lib/errors";
import type { Notification } from "@/lib/types";

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Manages the notification list for the authenticated user.
 * Automatically updates when new notifications arrive over WebSocket.
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const { subscribe, clearUnreadCount } = useRealtime();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        notificationsApi.getNotifications({ limit: 30 }),
        notificationsApi.getStats(),
      ]);
      setNotifications(list);
      setUnreadCount(stats.unread_count);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[useNotifications] fetch error:",
          parseError(err).message,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Real-time updates via WebSocket ────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribe<WsNotificationEvent>("notification", (event) => {
      const newNotif: Notification = {
        id: event.data.id,
        user_id: user?.id ?? "",
        actor_id: event.data.actor_id,
        actor_name: event.data.actor_name,
        actor_picture: event.data.actor_picture,
        notification_type: event.data.notification_type,
        entity_type: event.data.entity_type,
        entity_id: event.data.entity_id,
        message: event.data.message,
        is_read: false,
        created_at: event.data.created_at,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
      setUnreadCount((n) => n + 1);
    });
    return unsub;
  }, [subscribe, user?.id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((n) => Math.max(0, n - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    clearUnreadCount();
  }, [clearUnreadCount]);

  const deleteNotification = useCallback(async (id: string) => {
    await notificationsApi.deleteNotification(id);
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      const next = prev.filter((n) => n.id !== id);
      if (target && !target.is_read) {
        setUnreadCount((n) => Math.max(0, n - 1));
      }
      return next;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}

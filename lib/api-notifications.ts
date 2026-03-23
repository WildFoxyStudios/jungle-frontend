import { api } from "./api";
import type {
  Notification,
  NotificationStats,
  NotificationPreferences,
  PushSubscriptionPayload,
} from "./types";

export const notificationsApi = {
  // ── List & counts ────────────────────────────────────────────────────────

  getNotifications: (params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }) =>
    api.get<Notification[]>("/notifications", { params }).then((r) => r.data),

  getUnreadCount: () =>
    api
      .get<{ unread_count: number }>("/notifications/unread-count")
      .then((r) => r.data),

  getStats: () =>
    api.get<NotificationStats>("/notifications/stats").then((r) => r.data),

  // ── Read state ───────────────────────────────────────────────────────────

  markAsRead: (notificationId: string) =>
    api.post(`/notifications/${notificationId}/read`).then((r) => r.data),

  markAllAsRead: () => api.post("/notifications/read-all").then((r) => r.data),

  // ── Delete ───────────────────────────────────────────────────────────────

  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`).then((r) => r.data),

  // ── Preferences ──────────────────────────────────────────────────────────

  getPreferences: () =>
    api
      .get<NotificationPreferences>("/notifications/preferences")
      .then((r) => r.data),

  updatePreferences: (payload: Partial<NotificationPreferences>) =>
    api
      .put<NotificationPreferences>("/notifications/preferences", payload)
      .then((r) => r.data),

  // ── Push subscriptions ───────────────────────────────────────────────────

  subscribePush: (payload: PushSubscriptionPayload) =>
    api.post("/notifications/push/subscribe", payload).then((r) => r.data),

  unsubscribePush: (endpoint: string) =>
    api.post("/notifications/push/unsubscribe", endpoint).then((r) => r.data),
};

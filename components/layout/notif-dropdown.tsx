"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar } from "@/components/ui/avatar";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface NotifDropdownProps {
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  post_like:        "❤️",
  post_comment:     "💬",
  friend_request:   "👤",
  friend_accepted:  "🤝",
  group_invitation: "👥",
  event_invitation: "📅",
  message:          "✉️",
  birthday:         "🎂",
  default:          "🔔",
};

function getUrl(n: {
  notification_type: string;
  entity_id?: string;
  actor_id?: string;
}): string {
  switch (n.notification_type) {
    case "friend_request":
      return "/friends";
    case "message":
      return n.entity_id ? `/messages/${n.entity_id}` : "/messages";
    case "post_like":
    case "post_comment":
      return "/home";
    case "group_invitation":
      return n.entity_id ? `/groups/${n.entity_id}` : "/groups";
    case "event_invitation":
      return n.entity_id ? `/events/${n.entity_id}` : "/events";
    default:
      return "/notifications";
  }
}

export function NotifDropdown({ onClose }: NotifDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, loading, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1 w-[calc(100vw-1rem)] sm:w-[360px] max-w-[360px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 z-50 animate-fade-in-down overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-gray-700">
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">
          Notificaciones
        </h3>
        <button
          onClick={markAllAsRead}
          className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
        >
          <CheckCheck size={14} />
          Marcar todo leído
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[400px]">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}

        {!loading && notifications.length === 0 && (
          <EmptyState
            icon={<Bell size={28} />}
            title="Sin notificaciones"
            description="Cuando ocurra algo importante, te avisamos aquí."
            className="py-8"
          />
        )}

        {!loading &&
          notifications.map((n) => (
            <Link
              key={n.id}
              href={getUrl(n)}
              onClick={() => {
                markAsRead(n.id);
                onClose();
              }}
              className={cn(
                "flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors",
                !n.is_read && "bg-indigo-50/60 dark:bg-indigo-900/10",
              )}
            >
              {/* Actor avatar + type icon */}
              <div className="relative shrink-0">
                <Avatar
                  src={n.actor_picture}
                  alt={n.actor_name}
                  size="md"
                  fallbackName={n.actor_name}
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full text-sm leading-none">
                  {typeIcons[n.notification_type] ?? typeIcons.default}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm text-slate-800 dark:text-slate-100 line-clamp-2",
                    !n.is_read && "font-semibold",
                  )}
                >
                  {n.actor_name && (
                    <span className="font-bold">{n.actor_name} </span>
                  )}
                  {n.message ?? n.notification_type}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
              )}
            </Link>
          ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-gray-700 p-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Ver todas las notificaciones
        </Link>
      </div>
    </div>
  );
}

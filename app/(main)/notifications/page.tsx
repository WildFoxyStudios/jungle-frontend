"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { EmptyState } from "@/components/ui/empty-state";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { RichContent } from "@/components/ui/rich-content";
import type { Notification } from "@/lib/types";

// ─── Notification type config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  {
    emoji: string;
    label: string;
    color: string;
    url: (n: Notification) => string;
  }
> = {
  post_like: {
    emoji: "❤️",
    label: "Reacción",
    color: "bg-red-100 dark:bg-red-900/30",
    url: () => "/home",
  },
  post_comment: {
    emoji: "💬",
    label: "Comentario",
    color: "bg-blue-100 dark:bg-blue-900/30",
    url: () => "/home",
  },
  post_reaction: {
    emoji: "😊",
    label: "Reacción",
    color: "bg-amber-100 dark:bg-amber-900/30",
    url: () => "/home",
  },
  friend_request: {
    emoji: "👤",
    label: "Solicitud",
    color: "bg-indigo-100 dark:bg-indigo-900/30",
    url: () => "/friends",
  },
  friend_accepted: {
    emoji: "🤝",
    label: "Amistad",
    color: "bg-green-100 dark:bg-green-900/30",
    url: (n) => (n.actor_id ? `/profile/${n.actor_id}` : "/friends"),
  },
  group_invitation: {
    emoji: "👥",
    label: "Grupo",
    color: "bg-purple-100 dark:bg-purple-900/30",
    url: (n) => (n.entity_id ? `/groups/${n.entity_id}` : "/groups"),
  },
  group_post: {
    emoji: "📝",
    label: "Grupo",
    color: "bg-purple-100 dark:bg-purple-900/30",
    url: (n) => (n.entity_id ? `/groups/${n.entity_id}` : "/groups"),
  },
  event_invitation: {
    emoji: "📅",
    label: "Evento",
    color: "bg-orange-100 dark:bg-orange-900/30",
    url: (n) => (n.entity_id ? `/events/${n.entity_id}` : "/events"),
  },
  event_reminder: {
    emoji: "⏰",
    label: "Recordatorio",
    color: "bg-orange-100 dark:bg-orange-900/30",
    url: (n) => (n.entity_id ? `/events/${n.entity_id}` : "/events"),
  },
  message: {
    emoji: "✉️",
    label: "Mensaje",
    color: "bg-sky-100 dark:bg-sky-900/30",
    url: (n) => (n.entity_id ? `/messages?conv=${n.entity_id}` : "/messages"),
  },
  birthday: {
    emoji: "🎂",
    label: "Cumpleaños",
    color: "bg-pink-100 dark:bg-pink-900/30",
    url: (n) => (n.actor_id ? `/profile/${n.actor_id}` : "/friends"),
  },
  memory: {
    emoji: "📸",
    label: "Recuerdo",
    color: "bg-teal-100 dark:bg-teal-900/30",
    url: () => "/memories",
  },
  tagged_in_photo: {
    emoji: "🏷️",
    label: "Etiqueta",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    url: () => "/home",
  },
  donation_received: {
    emoji: "💝",
    label: "Donación",
    color: "bg-rose-100 dark:bg-rose-900/30",
    url: (n) => (n.entity_id ? `/fundraisers/${n.entity_id}` : "/fundraisers"),
  },
  job_application_status: {
    emoji: "💼",
    label: "Empleo",
    color: "bg-slate-100 dark:bg-slate-800",
    url: () => "/jobs/applications",
  },
  stream_start: {
    emoji: "🎥",
    label: "En vivo",
    color: "bg-red-100 dark:bg-red-900/30",
    url: () => "/live",
  },
  new_subscriber: {
    emoji: "⭐",
    label: "Suscriptor",
    color: "bg-amber-100 dark:bg-amber-900/30",
    url: () => "/home",
  },
  default: {
    emoji: "🔔",
    label: "Notificación",
    color: "bg-slate-100 dark:bg-slate-800",
    url: () => "/notifications",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
}

// ─── Filter categories ────────────────────────────────────────────────────────

const FILTER_TABS = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "No leídas" },
  {
    value: "social",
    label: "Social",
    types: ["friend_request", "friend_accepted", "birthday"],
  },
  {
    value: "posts",
    label: "Posts",
    types: ["post_like", "post_comment", "post_reaction", "tagged_in_photo"],
  },
  {
    value: "groups",
    label: "Grupos",
    types: ["group_invitation", "group_post"],
  },
  {
    value: "events",
    label: "Eventos",
    types: ["event_invitation", "event_reminder"],
  },
  { value: "messages", label: "Mensajes", types: ["message"] },
] as const;

type FilterValue = (typeof FILTER_TABS)[number]["value"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const toast = useToast();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    const tab = FILTER_TABS.find((t) => t.value === filter);
    if (tab && "types" in tab) {
      return (tab.types as readonly string[]).includes(n.notification_type);
    }
    return true;
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  const handleDelete = async (id: string) => {
    setDeleting((prev) => new Set([...prev, id]));
    try {
      await deleteNotification(id);
    } catch {
      toast.error("No se pudo eliminar la notificación");
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[700px] mx-auto px-4 py-6 pb-24">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <Badge variant="danger" size="lg">
              {unreadCount} nuevas
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<CheckCheck size={15} />}
              onClick={handleMarkAllRead}
            >
              <span className="hidden sm:inline">Marcar todas leídas</span>
              <span className="sm:hidden">Leer todas</span>
            </Button>
          )}
          <Link href="/settings">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400">
              <Settings size={18} />
            </button>
          </Link>
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <div className="surface mb-4">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex items-center px-2 min-w-max">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.value === "unread"
                  ? unreadCount
                  : tab.value === "all"
                    ? notifications.length
                    : "types" in tab
                      ? notifications.filter((n) =>
                          (tab.types as readonly string[]).includes(
                            n.notification_type,
                          ),
                        ).length
                      : 0;

              const isActive = filter === tab.value;

              return (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                        tab.value === "unread"
                          ? "bg-red-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                      )}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Notifications list ───────────────────────────────────────────── */}
      <div className="surface overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {/* Loading */}
        {loading && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<Bell size={32} />}
            title={filter === "unread" ? "Todo al día" : "Sin notificaciones"}
            description={
              filter === "unread"
                ? "No tienes notificaciones sin leer. ¡Estás al corriente!"
                : "Cuando ocurra algo importante te avisaremos aquí."
            }
            className="py-16"
          />
        )}

        {/* Items */}
        {!loading &&
          filtered.map((n, i) => (
            <NotificationItem
              key={n.id}
              notification={n}
              index={i}
              onMarkRead={() => markAsRead(n.id)}
              onDelete={() => handleDelete(n.id)}
              deleting={deleting.has(n.id)}
            />
          ))}
      </div>
    </div>
  );
}

// ─── Notification item ────────────────────────────────────────────────────────

function NotificationItem({
  notification: n,
  index,
  onMarkRead,
  onDelete,
  deleting,
}: {
  notification: Notification;
  index: number;
  onMarkRead: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = getConfig(n.notification_type);
  const url = cfg.url(n);

  const handleClick = () => {
    if (!n.is_read) onMarkRead();
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-4 transition-all duration-200 animate-fade-in",
        `stagger-${(index % 5) + 1}`,
        !n.is_read && "bg-indigo-50/60 dark:bg-indigo-900/10",
        hovered && "bg-slate-50 dark:bg-gray-800/60",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Unread dot */}
      {!n.is_read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
      )}

      {/* Avatar + type badge */}
      <div className="relative shrink-0">
        <Avatar
          src={n.actor_picture}
          alt={n.actor_name ?? ""}
          size="md"
          fallbackName={n.actor_name ?? ""}
        />
        <span
          className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white dark:border-gray-900",
            cfg.color,
          )}
        >
          {cfg.emoji}
        </span>
      </div>

      {/* Content */}
      <Link
        href={url}
        onClick={handleClick}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <p
          className={cn(
            "text-sm text-slate-800 dark:text-slate-100 leading-relaxed",
            !n.is_read && "font-medium",
          )}
        >
          {n.actor_name && (
            <span className="font-bold hover:underline">{n.actor_name} </span>
          )}
          <RichContent content={n.message ?? n.notification_type} />
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "text-xs font-medium",
              !n.is_read
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            {formatDistanceToNow(new Date(n.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-medium">
            {cfg.label}
          </span>
        </div>
      </Link>

      {/* Actions (shown on hover) */}
      <div
        className={cn(
          "flex items-center gap-1 shrink-0 transition-opacity",
          hovered ? "opacity-100" : "opacity-0",
        )}
      >
        {!n.is_read && (
          <button
            onClick={onMarkRead}
            title="Marcar como leída"
            className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <CheckCheck size={15} />
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={deleting}
          title="Eliminar"
          className={cn(
            "p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors",
            deleting && "opacity-50 cursor-not-allowed",
          )}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

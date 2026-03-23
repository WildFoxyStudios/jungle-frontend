"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { tokenStorage, WS_BASE_URL } from "@/lib/api";
import { useAuth } from "./AuthContext";

// ─── Event types ─────────────────────────────────────────────────────────────

export interface WsNotificationEvent {
  type: "notification";
  data: {
    id: string;
    notification_type: string;
    actor_id?: string;
    actor_name?: string;
    actor_picture?: string;
    message?: string;
    entity_type?: string;
    entity_id?: string;
    created_at: string;
  };
}

export interface WsMessageEvent {
  type: "message";
  data: {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name?: string;
    content?: string;
    message_type: string;
    created_at: string;
  };
}

export interface WsTypingEvent {
  type: "typing";
  data: {
    conversation_id: string;
    user_id: string;
    user_name?: string;
    is_typing: boolean;
  };
}

export interface WsPresenceEvent {
  type: "presence";
  data: {
    user_id: string;
    status: "online" | "offline" | "away";
    last_seen?: string;
  };
}

export interface WsCallEvent {
  type: "call";
  data: {
    call_id: string;
    caller_id: string;
    caller_name?: string;
    call_type: "audio" | "video";
    action: "incoming" | "answered" | "rejected" | "ended";
  };
}

export type RealtimeEvent =
  | WsNotificationEvent
  | WsMessageEvent
  | WsTypingEvent
  | WsPresenceEvent
  | WsCallEvent;

// ─── Context shape ────────────────────────────────────────────────────────────

interface RealtimeContextType {
  isConnected: boolean;
  /** Unread notification badge count (incremented on push, reset when user reads) */
  unreadCount: number;
  /** Live set of online user IDs */
  onlineUsers: Set<string>;
  /** Recent notification events received over WS */
  notifications: WsNotificationEvent[];
  /** Decrement / reset the unread badge from UI code */
  clearUnreadCount: () => void;
  /** Send a typing indicator for a conversation */
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  /** Subscribe to a specific WS event type */
  subscribe: <T extends RealtimeEvent>(
    type: T["type"],
    cb: (event: T) => void,
  ) => () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

const MAX_RECONNECT_ATTEMPTS = 6;
const BASE_RECONNECT_DELAY_MS = 1_000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<WsNotificationEvent[]>([]);

  // listener registry: eventType → Set<callback>
  const listenersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(
    new Map(),
  );

  // ── Internal dispatch ────────────────────────────────────────────────────
  const dispatch = useCallback((event: RealtimeEvent) => {
    const set = listenersRef.current.get(event.type);
    if (set) {
      set.forEach((cb) => cb(event));
    }
  }, []);

  // ── subscribe() exposed to consumers ────────────────────────────────────
  const subscribe = useCallback(
    <T extends RealtimeEvent>(
      type: T["type"],
      cb: (event: T) => void,
    ): (() => void) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }
      const typed = cb as (event: RealtimeEvent) => void;
      listenersRef.current.get(type)!.add(typed);
      return () => listenersRef.current.get(type)?.delete(typed);
    },
    [],
  );

  // ── Connect / reconnect logic ────────────────────────────────────────────
  const connect = useCallback(() => {
    const token = tokenStorage.get();
    if (!token || !isMounted.current) return;

    // Avoid double-connecting
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const url = `${WS_BASE_URL}/api/ws?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted.current) return;
        reconnectAttempts.current = 0;
        setIsConnected(true);
      };

      ws.onmessage = (evt) => {
        if (!isMounted.current) return;
        try {
          const event: RealtimeEvent = JSON.parse(evt.data as string);

          // Side-effects per type
          if (event.type === "notification") {
            setNotifications((prev) => [
              event as WsNotificationEvent,
              ...prev.slice(0, 99),
            ]);
            setUnreadCount((n) => n + 1);

            // Browser notification (best-effort)
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              const n = event as WsNotificationEvent;
              new Notification(n.data.actor_name ?? "Nueva notificación", {
                body: n.data.message ?? "",
                icon: n.data.actor_picture ?? "/favicon.ico",
                tag: n.data.id,
              });
            }
          } else if (event.type === "presence") {
            const p = event as WsPresenceEvent;
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              if (p.data.status === "online") {
                next.add(p.data.user_id);
              } else {
                next.delete(p.data.user_id);
              }
              return next;
            });
          }

          // Fan-out to registered subscribers
          dispatch(event);
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; nothing to do here
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        setIsConnected(false);
        wsRef.current = null;

        const token = tokenStorage.get();
        if (token && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const delay =
            BASE_RECONNECT_DELAY_MS *
            Math.pow(2, reconnectAttempts.current - 1);
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };
    } catch {
      // WebSocket constructor threw (e.g. SSR context) – ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS; // prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.onclose = null; // suppress the onclose handler
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // ── Lifecycle: connect when user is present ──────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    if (user) {
      reconnectAttempts.current = 0;
      connect();

      // Request browser notification permission once
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().catch(() => {});
      }
    } else {
      disconnect();
    }

    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [user, connect, disconnect]);

  // ── Public helpers ───────────────────────────────────────────────────────
  const clearUnreadCount = useCallback(() => setUnreadCount(0), []);

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "typing",
            conversation_id: conversationId,
            is_typing: isTyping,
          }),
        );
      }
    },
    [],
  );

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        unreadCount,
        onlineUsers,
        notifications,
        clearUnreadCount,
        sendTyping,
        subscribe,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtime(): RealtimeContextType {
  const ctx = useContext(RealtimeContext);
  if (!ctx)
    throw new Error("useRealtime must be used inside <RealtimeProvider>");
  return ctx;
}

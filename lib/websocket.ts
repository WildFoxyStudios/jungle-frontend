/**
 * websocket.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Legacy WebSocket client shim.
 *
 * The real real-time connection is now managed by RealtimeContext
 * (contexts/RealtimeContext.tsx), which creates a native WebSocket,
 * handles exponential-backoff reconnect, and fans events out to subscribers.
 *
 * This file is kept for backwards compatibility so that any existing imports
 * of `wsClient` or the event-type interfaces continue to compile.
 * New code should use `useRealtime()` from RealtimeContext instead.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { API_BASE_URL } from "./api";

// ─── Re-export the WS base URL so callers that use API_URL still work ─────────

/** @deprecated Use `WS_BASE_URL` from `@/lib/api` instead. */
export const API_URL = API_BASE_URL;

// ─── Event type definitions (kept for type-compatibility) ─────────────────────

export type NotificationEvent = {
  type: "notification";
  data: {
    id: string;
    type: string;
    actor_id: string;
    actor_name: string;
    actor_picture?: string;
    content: string;
    created_at: string;
  };
};

export type MessageEvent = {
  type: "message";
  data: {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: string;
  };
};

export type TypingEvent = {
  type: "typing";
  data: {
    conversation_id: string;
    user_id: string;
    user_name: string;
    is_typing: boolean;
  };
};

export type PresenceEvent = {
  type: "presence";
  data: {
    user_id: string;
    status: "online" | "offline" | "away";
    last_seen?: string;
  };
};

export type RealtimeEvent =
  | NotificationEvent
  | MessageEvent
  | TypingEvent
  | PresenceEvent;

// ─── No-op shim ───────────────────────────────────────────────────────────────
//
// All methods are intentional no-ops. The real connection lives in
// RealtimeContext. Calling these methods has no effect; they exist only
// so that code that hasn't been migrated yet doesn't throw at runtime.

class WebSocketClientShim {
  /** @deprecated Call `useRealtime()` from RealtimeContext instead. */
  connect(_token: string): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[wsClient] wsClient.connect() is a no-op. " +
          "Use RealtimeContext / useRealtime() for WebSocket functionality.",
      );
    }
  }

  /** @deprecated Disconnect is handled automatically by RealtimeContext. */
  disconnect(): void {}

  /** @deprecated Use RealtimeContext.sendTyping() instead. */
  send(_event: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[wsClient] wsClient.send() is a no-op. " +
          "Use RealtimeContext.sendTyping() or similar helpers instead.",
      );
    }
  }

  /** @deprecated Use RealtimeContext.subscribe() instead. */
  on(_eventType: string, _callback: (event: RealtimeEvent) => void): void {}

  /** @deprecated Use the unsubscribe function returned by RealtimeContext.subscribe() instead. */
  off(_eventType: string, _callback: (event: RealtimeEvent) => void): void {}

  /** @deprecated Check RealtimeContext.isConnected instead. */
  isConnected(): boolean {
    return false;
  }
}

/**
 * Legacy singleton WebSocket client.
 *
 * @deprecated
 * This object is a **no-op shim**. It exists only so that old imports compile.
 * Migrate to `useRealtime()` from `@/contexts/RealtimeContext`.
 */
export const wsClient = new WebSocketClientShim();

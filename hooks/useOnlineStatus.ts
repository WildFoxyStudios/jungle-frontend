"use client";

import { useState, useEffect } from "react";
import { useRealtime } from "@/contexts/RealtimeContext";

/**
 * Returns whether a specific user is currently online.
 * Subscribes to presence events from the WebSocket.
 *
 * @example
 * const isOnline = useOnlineStatus(userId);
 */
export function useOnlineStatus(userId: string | undefined): boolean {
  const { onlineUsers } = useRealtime();
  return userId ? onlineUsers.has(userId) : false;
}

/**
 * Returns whether the current device has a network connection.
 * Updates reactively when the connection is gained or lost.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  return isOnline;
}

import { useEffect, useRef } from "react";
import { useRealtime } from "@/contexts/RealtimeContext";

export function useTypingIndicator(conversationId: string) {
  const { sendTyping } = useRealtime();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const notifyTyping = () => {
    sendTyping(conversationId, true);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      sendTyping(conversationId, false);
    }, 2000);
  };

  const stopTyping = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    sendTyping(conversationId, false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { notifyTyping, stopTyping };
}

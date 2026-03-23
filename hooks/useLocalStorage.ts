"use client";

import { useState, useCallback } from "react";

/**
 * Typed localStorage hook with SSR safety.
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light'|'dark'>('theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function"
          ? (value as (p: T) => T)(prev)
          : value;
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // localStorage might be full or disabled
          }
        }
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

"use client";

import { useEffect, useRef } from "react";
import type React from "react";

export interface UseInfiniteScrollOptions {
  /** Called when the sentinel element enters the viewport */
  onLoadMore: () => void;
  /** If false, the observer is disconnected */
  hasMore: boolean;
  /** Whether a load is already in progress */
  loading: boolean;
  /** Intersection threshold (0–1). Default: 0.1 */
  threshold?: number;
  /** Root margin. Default: "200px" (pre-load before reaching the bottom) */
  rootMargin?: string;
}

/**
 * Attaches an IntersectionObserver to a sentinel element.
 * Call `onLoadMore` when the sentinel enters the viewport.
 *
 * @returns A ref to attach to the sentinel element (e.g. a `<div>` at the bottom).
 *
 * @example
 * const sentinelRef = useInfiniteScroll({ onLoadMore: loadMore, hasMore, loading });
 * // In JSX:
 * <div ref={sentinelRef} />
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  threshold = 0.1,
  rootMargin = "200px",
}: UseInfiniteScrollOptions): React.RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, threshold, rootMargin]);

  return sentinelRef;
}

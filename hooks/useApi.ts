"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type DependencyList,
} from "react";
import { parseError, type ApiError } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** Re-execute the last fetch. */
  refresh: () => void;
}

export interface UseApiOptions {
  /** If false, the fetch will NOT run automatically on mount. Default: true */
  immediate?: boolean;
}

// ─── useApi ───────────────────────────────────────────────────────────────────

/**
 * Generic data-fetching hook.
 *
 * @example
 * const { data: posts, loading, error, refresh } = useApi(
 *   () => postsApi.getFeed(),
 *   []
 * );
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
  options: UseApiOptions = {},
): UseApiState<T> {
  const { immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<ApiError | null>(null);
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  // Keep fetcher ref current without adding it to deps
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(parseError(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refresh: execute };
}

// ─── useMutation ─────────────────────────────────────────────────────────────

export interface UseMutationState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic mutation hook for POST / PUT / DELETE operations.
 *
 * @example
 * const { execute, loading, error } = useMutation(
 *   (postId: string) => postsApi.deletePost(postId)
 * );
 */
export function useMutation<T, Args extends unknown[]>(
  mutator: (...args: Args) => Promise<T>,
): {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mutatorRef = useRef(mutator);
  mutatorRef.current = mutator;

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutatorRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(parseError(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// ─── useInfiniteApi ───────────────────────────────────────────────────────────

export interface UseInfiniteApiState<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Offset-based infinite pagination hook.
 *
 * @example
 * const { items, loadMore, hasMore } = useInfiniteApi(
 *   (offset, limit) => postsApi.getUserPosts(userId, limit, offset),
 *   [userId]
 * );
 */
export function useInfiniteApi<T>(
  fetcher: (offset: number, limit: number) => Promise<T[]>,
  deps: DependencyList = [],
  pageSize = 20,
): UseInfiniteApiState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async (reset: boolean) => {
      if (reset) {
        setLoading(true);
        offsetRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const page = await fetcherRef.current(offsetRef.current, pageSize);
        if (!mountedRef.current) return;

        if (reset) {
          setItems(page);
        } else {
          // Deduplicate by id to prevent React key warnings from overlapping pages
          setItems((prev) => {
            const existingIds = new Set(prev.map((item: any) => item.id));
            const newItems = page.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }

        offsetRef.current += page.length;
        setHasMore(page.length === pageSize);
      } catch (err) {
        if (mountedRef.current) {
          setError(parseError(err));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [pageSize],
  );

  useEffect(() => {
    mountedRef.current = true;
    setItems([]);
    setHasMore(true);
    load(true);
    return () => {
      mountedRef.current = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      load(false);
    }
  }, [load, loadingMore, hasMore]);

  const refresh = useCallback(() => load(true), [load]);

  return { items, loading, loadingMore, error, hasMore, loadMore, refresh };
}

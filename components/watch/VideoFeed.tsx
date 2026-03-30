"use client";

import { useEffect, useMemo, useCallback } from "react";
import { TrendingUp, Video, RefreshCw } from "lucide-react";
import { watchApi } from "@/lib/api-watch";
import { useApi, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { VideoCard } from "./VideoCard";
import { AdCard } from "./AdCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scoreAndReorderFeed } from "@/lib/watch-algorithm";
import type { WatchVideo } from "@/lib/types";

export interface VideoFeedProps {
  searchQuery?: string;
  selectedCategory?: string;
  onVideoExpand: (videoId: string) => void;
}

/**
 * Vertical list of VideoCards with infinite scroll.
 * - Trending section at the top (5 videos)
 * - Client-side filtering by search (title, description, category) and category chip
 * - Loading skeletons, empty state, error with retry
 */
export function VideoFeed({
  searchQuery = "",
  selectedCategory = "",
  onVideoExpand,
}: VideoFeedProps) {
  // Trending videos (top 5)
  const {
    data: trending,
    loading: trendingLoading,
  } = useApi(() => watchApi.getTrending({ limit: 5 }), []);

  // Watch history for algorithm scoring
  const { data: watchHistory } = useApi(
    () => watchApi.getHistory({ limit: 50 }),
    [],
  );

  // Subscriptions for algorithm scoring
  const { data: subscriptionVideos } = useApi(
    () => watchApi.getSubscriptions({ limit: 50 }),
    [],
  );

  // Main feed with infinite scroll
  const {
    items: feedVideos,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) =>
      watchApi.getFeed({ category: selectedCategory || undefined, limit, offset }),
    [selectedCategory],
  );

  // Listen for refresh events from upload modal
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("refresh-watch-feed", handler);
    return () => window.removeEventListener("refresh-watch-feed", handler);
  }, [refresh]);

  // Client-side search filtering
  const filteredVideos = useMemo(() => {
    let videos = feedVideos;

    // Apply recommendation algorithm
    if (watchHistory && watchHistory.length > 0) {
      const creatorIds = subscriptionVideos
        ? [...new Set(subscriptionVideos.map((v) => v.user_id))]
        : [];
      videos = scoreAndReorderFeed(videos, watchHistory, creatorIds);
    }

    // Apply search filter
    if (searchQuery && searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      videos = videos.filter((v) => {
        const title = v.title?.toLowerCase() ?? "";
        const desc = v.description?.toLowerCase() ?? "";
        const cat = v.category?.toLowerCase() ?? "";
        return title.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }

    return videos;
  }, [feedVideos, searchQuery, watchHistory, subscriptionVideos]);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loading || loadingMore,
  });

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-9 h-9" rounded />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<RefreshCw size={28} />}
        title="Error al cargar videos"
        description={error.message}
        action={
          <Button variant="secondary" size="sm" onClick={refresh}>
            Reintentar
          </Button>
        }
      />
    );
  }

  // Empty state
  if (filteredVideos.length === 0 && !loadingMore) {
    return (
      <EmptyState
        icon={<Video size={28} />}
        title={searchQuery ? "Sin resultados" : "No hay videos"}
        description={
          searchQuery
            ? `No se encontraron videos para "${searchQuery}"`
            : "Aún no hay videos en esta sección. ¡Sé el primero en subir uno!"
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Trending section */}
      {!searchQuery && !selectedCategory && trending && trending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tendencias
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trending.slice(0, 5).map((v) => (
              <button
                key={v.id}
                onClick={() => onVideoExpand(v.id)}
                className="surface overflow-hidden text-left hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition-all"
              >
                <div className="relative aspect-video bg-black">
                  {v.thumbnail_url ? (
                    <img
                      src={v.thumbnail_url}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={24} className="text-slate-500" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="warning" size="sm">
                      🔥 Tendencia
                    </Badge>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {v.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {v.username ?? "Usuario"} · {v.views_count} vistas
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video feed with ad cards every 4-5 videos */}
      {filteredVideos.map((video, index) => (
        <div key={video.id}>
          <VideoCard video={video} onExpand={onVideoExpand} />
          {/* Insert an AdCard after every 4th video (positions 3, 7, 11, ...) */}
          {(index + 1) % 4 === 0 && (
            <div className="mt-6">
              <AdCard position={Math.floor(index / 4)} />
            </div>
          )}
        </div>
      ))}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

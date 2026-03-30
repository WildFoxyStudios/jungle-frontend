"use client";

import { Video, RefreshCw } from "lucide-react";
import { watchApi } from "@/lib/api-watch";
import { useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { VideoCard } from "./VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface SubscriptionFeedProps {
  onVideoExpand: (videoId: string) => void;
}

/**
 * Feed showing videos from subscribed creators, sorted by publication date.
 * Uses watchApi.getSubscriptions() with infinite scroll.
 */
export function SubscriptionFeed({ onVideoExpand }: SubscriptionFeedProps) {
  const {
    items: videos,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) => watchApi.getSubscriptions({ limit, offset }),
    [],
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loading || loadingMore,
  });

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

  if (error) {
    return (
      <EmptyState
        icon={<RefreshCw size={28} />}
        title="Error al cargar suscripciones"
        description={error.message}
        action={
          <Button variant="secondary" size="sm" onClick={refresh}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (videos.length === 0 && !loadingMore) {
    return (
      <EmptyState
        icon={<Video size={28} />}
        title="Sin suscripciones"
        description="Aún no sigues a ningún creador. Explora el feed y sigue a los creadores que te gusten."
      />
    );
  }

  return (
    <div className="space-y-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onExpand={onVideoExpand} />
      ))}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

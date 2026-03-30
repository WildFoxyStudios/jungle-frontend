"use client";

import { Bookmark, RefreshCw } from "lucide-react";
import { watchApi } from "@/lib/api-watch";
import { useApi } from "@/hooks/useApi";
import { VideoCard } from "./VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface SavedFeedProps {
  onVideoExpand: (videoId: string) => void;
}

/**
 * Feed showing saved/bookmarked videos.
 * Uses the dedicated GET /watch/saved endpoint.
 */
export function SavedFeed({ onVideoExpand }: SavedFeedProps) {
  const {
    data: videos,
    loading,
    error,
    refresh,
  } = useApi(() => watchApi.getSavedVideos({ limit: 50 }), []);

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
        title="Error al cargar guardados"
        description={error.message}
        action={
          <Button variant="secondary" size="sm" onClick={refresh}>
            Reintentar
          </Button>
        }
      />
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark size={28} />}
        title="Sin videos guardados"
        description="Guarda videos para verlos más tarde usando el botón de marcador en cada video."
      />
    );
  }

  return (
    <div className="space-y-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} onExpand={onVideoExpand} />
      ))}
    </div>
  );
}

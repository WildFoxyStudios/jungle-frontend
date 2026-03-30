"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreatorInfo } from "./CreatorInfo";
import { ActionBar } from "./ActionBar";
import { useVideoAutoPlay } from "@/hooks/useVideoAutoPlay";
import { cn } from "@/lib/utils";
import type { WatchVideo } from "@/lib/types";

export interface VideoCardProps {
  video: WatchVideo;
  onExpand: (videoId: string) => void;
}

/**
 * Vertical video card for the Watch feed.
 * - ~70vh height with 16:9 video container
 * - Auto-play via useVideoAutoPlay when visible
 * - Trending badge when is_trending
 * - Inline mute/unmute + progress bar
 */
export function VideoCard({ video, onExpand }: VideoCardProps) {
  const {
    videoRef,
    containerRef,
    isPlaying,
    isMuted,
    toggleMute,
    progress,
  } = useVideoAutoPlay({ videoId: video.id });

  return (
    <div className="surface overflow-hidden">
      {/* Video container — 16:9 aspect ratio */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black cursor-pointer group"
        onClick={() => onExpand(video.id)}
      >
        {/* Thumbnail fallback */}
        {video.thumbnail_url && !isPlaying && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail_url ?? undefined}
          className="w-full h-full object-contain"
          loop
          playsInline
          muted
          preload="metadata"
        />

        {/* Trending badge */}
        {video.is_trending && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" size="sm">
              🔥 Tendencia
            </Badge>
          </div>
        )}

        {/* Mute/unmute button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-indigo-500 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Info section */}
      <div className="p-3 space-y-2.5">
        {/* Title */}
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:underline"
          onClick={() => onExpand(video.id)}
        >
          {video.title}
        </h3>

        {/* Creator info */}
        <CreatorInfo
          userId={video.user_id}
          username={video.username}
          publishedAt={video.published_at ?? video.created_at}
        />

        {/* Action bar */}
        <ActionBar
          video={video}
          onCommentClick={() => onExpand(video.id)}
        />
      </div>
    </div>
  );
}

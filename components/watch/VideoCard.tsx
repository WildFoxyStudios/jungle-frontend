"use client";

import { useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreatorInfo } from "./CreatorInfo";
import { ActionBar } from "./ActionBar";
import { useVideoAutoPlay } from "@/hooks/useVideoAutoPlay";
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
 * - Passes is_liked and is_saved state to ActionBar
 */
export function VideoCard({ video, onExpand }: VideoCardProps) {
  const [showThumbnail, setShowThumbnail] = useState(true);
  
  const {
    videoRef,
    containerRef,
    isPlaying,
    isMuted,
    toggleMute,
    progress,
  } = useVideoAutoPlay({ videoId: video.id });

  // Hide thumbnail once video starts playing
  if (isPlaying && showThumbnail) {
    setShowThumbnail(false);
  }

  return (
    <div className="surface overflow-hidden rounded-xl">
      {/* Video container — 16:9 aspect ratio */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black cursor-pointer group"
        onClick={() => onExpand(video.id)}
      >
        {/* Thumbnail fallback - show until video plays */}
        {video.thumbnail_url && showThumbnail && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
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

        {/* Play icon overlay when not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Trending badge */}
        {video.is_trending && (
          <div className="absolute top-3 left-3 z-20">
            <Badge variant="warning" size="sm">
              Tendencia
            </Badge>
          </div>
        )}

        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="px-1.5 py-0.5 text-xs font-medium bg-black/70 text-white rounded">
              {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* Mute/unmute button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-20">
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
          avatarUrl={video.avatar_url}
          publishedAt={video.published_at ?? video.created_at}
          isFollowing={video.is_following}
        />

        {/* Action bar - pass is_liked and is_saved from video */}
        <ActionBar
          video={video}
          isLiked={video.is_liked}
          isSaved={video.is_saved}
          onCommentClick={() => onExpand(video.id)}
        />
      </div>
    </div>
  );
}

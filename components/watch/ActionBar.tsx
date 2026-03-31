"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Eye } from "lucide-react";
import { watchApi } from "@/lib/api-watch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface ActionBarProps {
  video: {
    id: string;
    likes_count: number;
    comments_count: number;
    views_count: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  onCommentClick?: () => void;
  orientation?: "horizontal" | "vertical";
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
}

/**
 * Action bar with Like (toggle), Comment, Share, and Save (toggle) buttons.
 * Like and Save use optimistic updates — UI changes immediately, reverts on API failure.
 */
export function ActionBar({
  video,
  isLiked: initialLiked = false,
  isSaved: initialSaved = false,
  onCommentClick,
  orientation = "horizontal",
}: ActionBarProps) {
  const toast = useToast();

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(video.likes_count ?? 0);
  const [saved, setSaved] = useState(initialSaved);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  // Sync state when props change (e.g., when navigating between videos)
  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    setLikesCount(video.likes_count ?? 0);
  }, [video.likes_count]);

  const handleLikeToggle = async () => {
    if (likeBusy) return;
    const prevLiked = liked;
    const prevCount = likesCount;
    // Optimistic update
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setLikeBusy(true);
    try {
      if (prevLiked) {
        await watchApi.unlikeVideo(video.id);
      } else {
        await watchApi.likeVideo(video.id);
      }
    } catch {
      // Revert
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error("Error al actualizar me gusta");
    } finally {
      setLikeBusy(false);
    }
  };

  const handleSaveToggle = async () => {
    if (saveBusy) return;
    const prevSaved = saved;
    setSaved(!prevSaved);
    setSaveBusy(true);
    try {
      if (prevSaved) {
        await watchApi.unsaveVideo(video.id);
      } else {
        await watchApi.saveVideo(video.id);
      }
    } catch {
      setSaved(prevSaved);
      toast.error("Error al guardar video");
    } finally {
      setSaveBusy(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/watch?v=${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex gap-1",
        isVertical ? "flex-col items-center" : "items-center",
      )}
    >
      {/* Like */}
      <button
        onClick={handleLikeToggle}
        disabled={likeBusy}
        className={cn(
          "flex items-center gap-1.5 rounded-lg transition-colors",
          isVertical ? "flex-col p-2" : "px-3 py-2",
          liked
            ? "text-red-500"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800",
        )}
        aria-label={liked ? "Quitar me gusta" : "Me gusta"}
      >
        <Heart size={20} fill={liked ? "currentColor" : "none"} />
        <span className="text-xs font-medium">{formatCount(likesCount)}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onCommentClick}
        className={cn(
          "flex items-center gap-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors",
          isVertical ? "flex-col p-2" : "px-3 py-2",
        )}
        aria-label="Comentar"
      >
        <MessageCircle size={20} />
        <span className="text-xs font-medium">
          {formatCount(video.comments_count)}
        </span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className={cn(
          "flex items-center gap-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors",
          isVertical ? "flex-col p-2" : "px-3 py-2",
        )}
        aria-label="Compartir"
      >
        <Share2 size={20} />
        <span className="text-xs font-medium">Compartir</span>
      </button>

      {/* Save */}
      <button
        onClick={handleSaveToggle}
        disabled={saveBusy}
        className={cn(
          "flex items-center gap-1.5 rounded-lg transition-colors",
          isVertical ? "flex-col p-2" : "px-3 py-2",
          saved
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800",
        )}
        aria-label={saved ? "Quitar de guardados" : "Guardar"}
      >
        <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        <span className="text-xs font-medium">
          {saved ? "Guardado" : "Guardar"}
        </span>
      </button>

      {/* Views (display only) */}
      {!isVertical && (
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Eye size={14} />
          {formatCount(video.views_count)}
        </span>
      )}
    </div>
  );
}

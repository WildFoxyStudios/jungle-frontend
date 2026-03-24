"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  Music2,
  VolumeX,
  Volume2,
  Play,
  Pause,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Send,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { reelsApi } from "@/lib/api-reels";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteApi, useMutation } from "@/hooks/useApi";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Reel, ReelComment } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReelsPage() {
  const [muted, setMuted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    items: reels,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) => reelsApi.getFeed({ limit, offset }),
    [],
    10,
  );

  // Load more when near end
  useEffect(() => {
    if (activeIndex >= reels.length - 3 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [activeIndex, reels.length, hasMore, loadingMore]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        setActiveIndex((i) => Math.min(i + 1, reels.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "m") {
        setMuted((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [reels.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-white animate-spin" />
          <p className="text-white/60 text-sm">Cargando reels...</p>
        </div>
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <EmptyState
          icon={<Play size={40} />}
          title="Sin reels disponibles"
          description="Sigue a creadores para ver sus reels aquí"
          className="text-white"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ top: "3.5rem" }}
    >
      {/* Reel stack */}
      <div
        className="h-full transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(-${activeIndex * 100}%)`,
        }}
      >
        {reels.map((reel, i) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            isActive={i === activeIndex}
            muted={muted}
            onToggleMute={() => setMuted((v) => !v)}
          />
        ))}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="h-full flex items-center justify-center bg-black">
            <Loader2 size={32} className="text-white/60 animate-spin" />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
        <button
          onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
          disabled={activeIndex === 0}
          className={cn(
            "w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white transition-all",
            activeIndex === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-white/20 active:scale-95",
          )}
          aria-label="Reel anterior"
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={() =>
            setActiveIndex((i) => Math.min(i + 1, reels.length - 1))
          }
          disabled={activeIndex >= reels.length - 1}
          className={cn(
            "w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white transition-all",
            activeIndex >= reels.length - 1
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-white/20 active:scale-95",
          )}
          aria-label="Siguiente reel"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        {reels
          .slice(Math.max(0, activeIndex - 2), activeIndex + 5)
          .map((_, idx) => {
            const realIdx = Math.max(0, activeIndex - 2) + idx;
            return (
              <button
                key={realIdx}
                onClick={() => setActiveIndex(realIdx)}
                className={cn(
                  "rounded-full transition-all",
                  realIdx === activeIndex
                    ? "w-1.5 h-5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70",
                )}
              />
            );
          })}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/30 text-xs hidden md:block pointer-events-none select-none">
        ↑↓ navegar · M silenciar
      </div>
    </div>
  );
}

// ─── Reel item ─────────────────────────────────────────────────────────────────

function ReelItem({
  reel,
  isActive,
  muted,
  onToggleMute,
}: {
  reel: Reel;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef<number>(0);

  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const { execute: likeReel } = useMutation(() => reelsApi.like(reel.id));
  const { execute: unlikeReel } = useMutation(() => reelsApi.unlike(reel.id));
  const { execute: saveReel } = useMutation(() => reelsApi.save(reel.id));
  const { execute: unsaveReel } = useMutation(() => reelsApi.unsave(reel.id));

  // Auto-play/pause when active changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));

      // Record view after 2 seconds
      const timer = setTimeout(() => {
        reelsApi
          .recordView(reel.id, { watch_time: 2, completed: false })
          .catch(() => {});
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      video.pause();
      video.currentTime = 0;
      queueMicrotask(() => {
        setPlaying(false);
        setProgress(0);
      });
    }
  }, [isActive, reel.id]);

  // Sync mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  // Loop video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnd = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await unlikeReel();
      else await likeReel();
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const handleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) await unsaveReel();
      else {
        await saveReel();
        toast.success("Reel guardado");
      }
    } catch {
      setSaved(wasSaved);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: reel.caption ?? "Reel",
        url: `${window.location.origin}/reels?id=${reel.id}`,
      });
    } catch {
      await navigator.clipboard.writeText(
        `${window.location.origin}/reels?id=${reel.id}`,
      );
      toast.success("Enlace copiado");
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={muted}
        poster={reel.thumbnail_url ?? undefined}
        onClick={togglePlay}
        preload={isActive ? "auto" : "none"}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Play/Pause overlay */}
      {!playing && isActive && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center animate-fade-in-scale">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mute button (top right) */}
      <button
        onClick={onToggleMute}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
        aria-label={muted ? "Activar sonido" : "Silenciar"}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Bottom: user info + caption */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        {/* User info */}
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${reel.user_id}`}>
            <Avatar
              src={reel.profile_picture_url}
              alt={reel.username}
              size="md"
              fallbackName={reel.username}
              className="ring-2 ring-white"
            />
          </Link>
          <div>
            <Link href={`/profile/${reel.user_id}`}>
              <span className="font-bold text-white text-sm hover:underline">
                @{reel.username ?? "usuario"}
              </span>
            </Link>
            <p className="text-white/60 text-xs">
              {formatDistanceToNow(new Date(reel.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
          {user?.id !== reel.user_id && (
            <button className="ml-2 px-3 py-1 rounded-full border border-white text-white text-xs font-bold hover:bg-white hover:text-black transition-colors">
              Seguir
            </button>
          )}
        </div>

        {/* Caption */}
        {reel.caption && <ExpandableCaption caption={reel.caption} />}

        {/* Audio info */}
        {reel.audio_name && (
          <div className="flex items-center gap-1.5 mt-2">
            <Music2
              size={13}
              className="text-white animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <p className="text-white text-xs font-medium truncate max-w-[200px]">
              {reel.audio_name}
            </p>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <ActionButton
          icon={
            <Heart
              size={26}
              className={liked ? "text-red-500" : "text-white"}
              fill={liked ? "currentColor" : "none"}
            />
          }
          label={formatCount(likesCount)}
          onClick={handleLike}
          active={liked}
          activeColor="text-red-500"
        />

        {/* Comments */}
        <ActionButton
          icon={<MessageCircle size={26} className="text-white" />}
          label={formatCount(reel.comments_count)}
          onClick={() => setShowComments(true)}
        />

        {/* Share */}
        <ActionButton
          icon={<Share2 size={24} className="text-white" />}
          label={formatCount(reel.shares_count)}
          onClick={handleShare}
        />

        {/* Save */}
        <ActionButton
          icon={
            saved ? (
              <BookmarkCheck size={24} className="text-yellow-400" />
            ) : (
              <Bookmark size={24} className="text-white" />
            )
          }
          label="Guardar"
          onClick={handleSave}
          active={saved}
        />

        {/* More */}
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <MoreHorizontal size={22} className="text-white" />
          </div>
        </button>

        {/* Spinning album art */}
        <div
          className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20 animate-spin"
          style={{ animationDuration: "4s" }}
        >
          <Music2 size={16} className="text-white" />
        </div>
      </div>

      {/* Comments panel */}
      <CommentsPanel
        open={showComments}
        onClose={() => setShowComments(false)}
        reelId={reel.id}
        commentsCount={reel.comments_count}
      />
    </div>
  );
}

// ─── Expandable caption ────────────────────────────────────────────────────────

function ExpandableCaption({ caption }: { caption: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = caption.length > 100;

  return (
    <p className="text-white text-sm leading-relaxed">
      {expanded || !isLong ? caption : `${caption.slice(0, 100)}...`}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-white/60 ml-1 font-medium hover:text-white transition-colors"
        >
          {expanded ? "ver menos" : "más"}
        </button>
      )}
    </p>
  );
}

// ─── Action button ─────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
  active,
  activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div
        className={cn(
          "w-11 h-11 rounded-full bg-black/30 backdrop-blur flex items-center justify-center",
          "group-hover:bg-black/50 active:scale-90 transition-all duration-150",
          active && "scale-110",
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-[11px] font-bold",
          active && activeColor ? activeColor : "text-white",
        )}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Comments panel ────────────────────────────────────────────────────────────

function CommentsPanel({
  open,
  onClose,
  reelId,
  commentsCount,
}: {
  open: boolean;
  onClose: () => void;
  reelId: string;
  commentsCount: number;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    reelsApi
      .getComments(reelId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, reelId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await reelsApi.createComment(reelId, { content: content.trim() });
      setContent("");
      // Refetch
      const updated = await reelsApi.getComments(reelId);
      setComments(updated);
    } catch {
      toast.error("Error al comentar");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">
            {commentsCount} comentarios
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">
              Sé el primero en comentar 💬
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Avatar size="sm" fallbackName="U" />
              <div className="flex-1">
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl px-3.5 py-2.5 inline-block">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    @usuario
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">
                    {c.content}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-2">
                  {formatDistanceToNow(new Date(c.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Avatar
            src={user?.profile_picture_url}
            alt={user?.full_name}
            size="sm"
            fallbackName={user?.full_name ?? user?.username ?? ""}
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Añade un comentario..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:bg-white dark:focus:bg-gray-700 border border-transparent focus:border-indigo-400 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className={cn(
              "p-2.5 rounded-full transition-all",
              content.trim()
                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md"
                : "text-slate-300 dark:text-slate-600 cursor-not-allowed",
            )}
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Eye,
  Loader2,
} from "lucide-react";
import { watchApi } from "@/lib/api-watch";
import { useToast } from "@/components/ui/toast";
import { CreatorInfo } from "./CreatorInfo";
import { ActionBar } from "./ActionBar";
import { CommentsPanel } from "./CommentsPanel";
import { cn } from "@/lib/utils";
import type { WatchVideo } from "@/lib/types";

export interface ExpandedPlayerProps {
  videoId: string;
  onClose: () => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Expanded video player with full controls and comments panel.
 * - Grid layout: video left, comments right (desktop) / stacked (mobile)
 * - Full controls: play/pause, seekable progress, volume, speed, fullscreen
 * - Close with X button or Escape key
 * - Loads video data via watchApi.getVideo(videoId)
 */
export function ExpandedPlayer({ videoId, onClose }: ExpandedPlayerProps) {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [video, setVideo] = useState<WatchVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Track if view has been recorded
  const viewRecordedRef = useRef(false);

  // Load video data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    viewRecordedRef.current = false; // Reset view tracking on new video
    watchApi
      .getVideo(videoId)
      .then((data) => {
        if (!cancelled) setVideo(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Record view after 3 seconds of playback
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;

    const handleTimeUpdate = () => {
      if (el.currentTime >= 3 && !viewRecordedRef.current) {
        viewRecordedRef.current = true;
        const percentage = el.duration > 0 ? (el.currentTime / el.duration) * 100 : 0;
        watchApi.recordView(videoId, {
          watch_time: Math.round(el.currentTime),
          watch_percentage: Math.round(percentage),
        }).catch(() => {
          // Silent fail for view recording
        });
      }
    };

    el.addEventListener("timeupdate", handleTimeUpdate);
    return () => el.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoId, video]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Sync video events
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () => setDuration(el.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [video]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch((err) => { console.error("[ExpandedPlayer.play]", err); });
    else el.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = val;
    setVolume(val);
    if (val === 0) {
      el.muted = true;
      setIsMuted(true);
    } else if (el.muted) {
      el.muted = false;
      setIsMuted(false);
    }
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = videoRef.current;
      if (!el || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      el.currentTime = ratio * duration;
    },
    [duration],
  );

  const handleSpeedChange = useCallback((rate: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await el.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      // Fullscreen not supported
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Loading state
  if (loading) {
    return (
      <div className="surface p-12 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // Error state
  if (error || !video) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-slate-500">No se pudo cargar el video</p>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-indigo-600 hover:underline"
        >
          Volver al feed
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 z-10 w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        aria-label="Cerrar reproductor"
      >
        <X size={18} />
      </button>

      {/* Grid: video + comments */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0 surface overflow-hidden rounded-xl">
        {/* Left: Video + info */}
        <div className="flex flex-col">
          {/* Video container */}
          <div ref={containerRef} className="relative bg-black aspect-video group">
            <video
              ref={videoRef}
              src={video.video_url}
              poster={video.thumbnail_url ?? undefined}
              className="w-full h-full object-contain"
              playsInline
              onClick={togglePlay}
            />

            {/* Play/pause overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20"
                aria-label="Reproducir"
              >
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                  <Play size={28} className="text-white ml-1" fill="white" />
                </div>
              </button>
            )}

            {/* Controls bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Seekable progress bar */}
              <div
                className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer mb-3 group/seek"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-indigo-500 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white opacity-0 group-hover/seek:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center gap-3 text-white">
                {/* Play/Pause */}
                <button onClick={togglePlay} aria-label={isPlaying ? "Pausar" : "Reproducir"}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} fill="white" />}
                </button>

                {/* Time */}
                <span className="text-xs font-mono tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex-1" />

                {/* Volume */}
                <button onClick={toggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar"}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 accent-indigo-500"
                  aria-label="Volumen"
                />

                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu((v) => !v)}
                    className="text-xs font-semibold px-2 py-1 rounded hover:bg-white/20"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-xl py-1 min-w-[80px]">
                      {PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedChange(rate)}
                          className={cn(
                            "block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10",
                            rate === playbackRate && "text-indigo-400 font-semibold",
                          )}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Video info */}
          <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {video.title}
            </h2>

            {/* Metrics */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {formatCount(video.views_count)} vistas
              </span>
              <span>·</span>
              <span>
                {new Date(video.published_at ?? video.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Description */}
            {video.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                {video.description}
              </p>
            )}

            {/* Action bar (horizontal) */}
            <ActionBar
              video={video}
              isLiked={video.is_liked}
              isSaved={video.is_saved}
              orientation="horizontal"
              onCommentClick={() => {
                /* comments panel is already visible */
              }}
            />

            {/* Creator info */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <CreatorInfo
                userId={video.user_id}
                username={video.username}
                publishedAt={video.published_at ?? video.created_at}
              />
            </div>
          </div>
        </div>

        {/* Right: Comments panel */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 h-[400px] lg:h-auto">
          <CommentsPanel videoId={videoId} commentsCount={video.comments_count} />
        </div>
      </div>
    </div>
  );
}

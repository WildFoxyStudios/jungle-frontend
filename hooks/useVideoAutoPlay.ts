"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { watchApi } from "@/lib/api-watch";

export interface UseVideoAutoPlayOptions {
  /** Intersection ratio thresholds for play/pause. Default: { play: 0.5, pause: 0.3 } */
  threshold?: { play: number; pause: number };
  /** Start muted. Default: true */
  muted?: boolean;
  /** Video ID for recording views */
  videoId?: string;
}

export interface UseVideoAutoPlayReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  /** Playback progress 0–100 */
  progress: number;
  /** Accumulated watch time in seconds */
  watchTime: number;
}

/**
 * Hook that manages auto-play based on IntersectionObserver visibility.
 *
 * - Plays (muted) when the container is >= 50% visible
 * - Pauses when visibility drops below 30%
 * - Tracks watch time via the video `timeupdate` event
 * - Calls `watchApi.recordView()` once after 3 seconds of playback
 */
export function useVideoAutoPlay(
  options: UseVideoAutoPlayOptions = {},
): UseVideoAutoPlayReturn {
  const {
    threshold = { play: 0.5, pause: 0.3 },
    muted: initialMuted = true,
    videoId,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [progress, setProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  // Track whether we've already recorded a view for this video
  const viewRecordedRef = useRef(false);
  // Keep latest watchTime in a ref so the timeupdate handler always sees it
  const watchTimeRef = useRef(0);

  // ── Intersection Observer ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const video = videoRef.current;
        if (!video) return;

        if (entry.intersectionRatio >= threshold.play) {
          video.muted = isMuted;
          video.play().catch((err: unknown) => {
            console.error("[video.play] autoplay blocked:", err);
          });
          setIsPlaying(true);
        } else if (entry.intersectionRatio < threshold.pause) {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.3, 0.5, 1.0] },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [threshold.play, threshold.pause, isMuted]);

  // ── Time update: track progress + watchTime + record view ─────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const duration = video.duration || 0;
      const current = video.currentTime || 0;

      // Update progress (0–100)
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }

      // Update watch time
      setWatchTime(current);
      watchTimeRef.current = current;

      // Record view once after 3 seconds of playback
      if (current >= 3 && !viewRecordedRef.current && videoId) {
        viewRecordedRef.current = true;
        const percentage = duration > 0 ? (current / duration) * 100 : 0;
        watchApi
          .recordView(videoId, {
            watch_time: Math.round(current),
            watch_percentage: Math.round(percentage),
          })
          .catch((err: unknown) => {
            console.error("[watchApi.recordView] fire-and-forget failed:", err);
          });
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoId]);

  // ── Toggle mute ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  return {
    videoRef,
    containerRef,
    isPlaying,
    isMuted,
    toggleMute,
    progress,
    watchTime,
  };
}

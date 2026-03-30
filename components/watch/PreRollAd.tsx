"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface PreRollAdProps {
  onSkip: () => void;
  onComplete: () => void;
}

const AD_DURATION = 5; // seconds
const SKIP_AFTER = 3; // seconds before skip button appears

/**
 * Pre-roll ad overlay shown before video playback.
 * - 5-second ad with countdown
 * - "Saltar" button appears after 3 seconds
 * - Calls onSkip or onComplete when done
 */
export function PreRollAd({ onSkip, onComplete }: PreRollAdProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= AD_DURATION) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return AD_DURATION;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-complete when ad finishes
  useEffect(() => {
    if (elapsed >= AD_DURATION) {
      onComplete();
    }
  }, [elapsed, onComplete]);

  const canSkip = elapsed >= SKIP_AFTER;
  const remaining = AD_DURATION - elapsed;
  const progress = (elapsed / AD_DURATION) * 100;

  return (
    <div className="absolute inset-0 z-20 bg-black flex flex-col">
      {/* Ad content */}
      <div className="flex-1 flex items-center justify-center relative">
        <img
          src="https://placehold.co/800x450/1e293b/94a3b8?text=Anuncio+Pre-Roll"
          alt="Anuncio"
          className="max-w-full max-h-full object-contain"
        />

        {/* Sponsored badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="default" size="sm">
            Patrocinado
          </Badge>
        </div>

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-black/80">
        <span className="text-xs text-white/70">
          El video comenzará en {remaining}s
        </span>

        {canSkip ? (
          <Button variant="secondary" size="sm" onClick={onSkip}>
            Saltar anuncio
          </Button>
        ) : (
          <span className="text-xs text-white/50">
            Saltar en {SKIP_AFTER - elapsed}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/20">
        <div
          className="h-full bg-indigo-500 transition-[width] duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

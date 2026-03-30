"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxProps {
  images: { url: string; caption?: string }[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, open, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
  }, [images.length, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open || images.length === 0) return null;

  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-white/70 text-sm">
          {index + 1} / {images.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Acercar"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Alejar"
          >
            <ZoomOut size={20} />
          </button>
          <a
            href={current.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Descargar"
          >
            <Download size={20} />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-12">
        {hasPrev && (
          <button
            onClick={() => { setIndex((i) => i - 1); setZoom(1); }}
            className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <img
          src={current.url}
          alt={current.caption ?? ""}
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />

        {hasNext && (
          <button
            onClick={() => { setIndex((i) => i + 1); setZoom(1); }}
            className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Caption */}
      {current.caption && (
        <div className="px-4 py-3 text-center shrink-0">
          <p className="text-white/80 text-sm">{current.caption}</p>
        </div>
      )}
    </div>,
    document.body,
  );
}

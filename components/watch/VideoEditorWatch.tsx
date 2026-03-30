"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Type,
  Wand2,
  Loader2,
  Sun,
  Contrast,
  GripHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface VideoEditorWatchProps {
  file: File;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

interface TrimRange {
  start: number;
  end: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  startTime: number;
  endTime: number;
}

type FilterPreset = "original" | "warm" | "cool" | "vintage" | "bw" | "vivid";

interface FilterConfig {
  brightness: number;
  contrast: number;
  preset: FilterPreset;
}

const FILTER_PRESETS: Record<FilterPreset, { label: string; css: string }> = {
  original: { label: "Original", css: "none" },
  warm: { label: "Cálido", css: "sepia(0.3) saturate(1.4) brightness(1.1)" },
  cool: { label: "Frío", css: "saturate(0.8) hue-rotate(15deg) brightness(1.05)" },
  vintage: { label: "Vintage", css: "sepia(0.5) contrast(0.9) brightness(0.95)" },
  bw: { label: "B&N", css: "grayscale(1) contrast(1.1)" },
  vivid: { label: "Vivid", css: "saturate(1.8) contrast(1.15) brightness(1.05)" },
};

const FONT_COLORS = ["#ffffff", "#000000", "#ef4444", "#3b82f6", "#22c55e", "#eab308"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Video editor for Watch uploads.
 * Tools: trim, text overlay, color filters, brightness/contrast.
 * Export via canvas for the edited video.
 */
export function VideoEditorWatch({ file, onSave, onCancel }: VideoEditorWatchProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"trim" | "text" | "filters">("trim");
  const [isExporting, setIsExporting] = useState(false);

  // Trim state
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 });

  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [editingText, setEditingText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(32);

  // Filter state
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    brightness: 100,
    contrast: 100,
    preset: "original",
  });

  // Load video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      setDuration(video.duration);
      setTrimRange({ start: 0, end: video.duration });
    };

    video.ontimeupdate = () => setCurrentTime(video.currentTime);
    video.onplay = () => setIsPlaying(true);
    video.onpause = () => setIsPlaying(false);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.currentTime < trimRange.start || video.currentTime >= trimRange.end) {
        video.currentTime = trimRange.start;
      }
      video.play().catch((err) => { console.error("[VideoEditor.play] preview:", err); });
    } else {
      video.pause();
    }
  }, [trimRange]);

  const handleSeek = useCallback(([value]: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }, []);

  const handleTrimChange = useCallback(
    (type: "start" | "end", value: number) => {
      setTrimRange((prev) => {
        const next = { ...prev, [type]: value };
        if (next.end - next.start < 0.5) {
          return prev; // Minimum 0.5s duration
        }
        return next;
      });
      const video = videoRef.current;
      if (video) {
        video.currentTime = value;
        setCurrentTime(value);
      }
    },
    [],
  );

  const addTextOverlay = useCallback(() => {
    if (!editingText.trim()) return;
    const overlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: editingText.trim(),
      x: 50,
      y: 50,
      fontSize: textSize,
      color: textColor,
      fontFamily: "sans-serif",
      startTime: trimRange.start,
      endTime: trimRange.end,
    };
    setTextOverlays((prev) => [...prev, overlay]);
    setEditingText("");
  }, [editingText, textColor, textSize, trimRange]);

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getFilterCSS = useCallback(() => {
    const preset = FILTER_PRESETS[filterConfig.preset].css;
    const adjustments = `brightness(${filterConfig.brightness}%) contrast(${filterConfig.contrast}%)`;
    return preset === "none" ? adjustments : `${preset} ${adjustments}`;
  }, [filterConfig]);

  // Export edited video via canvas
  const handleExport = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsExporting(true);

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      // Use MediaRecorder to capture canvas stream
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const exportPromise = new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve(blob);
        };
        mediaRecorder.onerror = () => reject(new Error("Export failed"));
      });

      // Start recording
      video.currentTime = trimRange.start;
      await new Promise<void>((r) => { video.onseeked = () => r(); });

      mediaRecorder.start();
      video.play().catch((err) => { console.error("[VideoEditor.play] export:", err); });

      // Draw frames with filters and text overlays
      const drawFrame = () => {
        if (video.currentTime >= trimRange.end || video.paused) {
          video.pause();
          mediaRecorder.stop();
          return;
        }

        // Apply filter
        ctx.filter = getFilterCSS();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";

        // Draw text overlays
        for (const overlay of textOverlays) {
          if (video.currentTime >= overlay.startTime && video.currentTime <= overlay.endTime) {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.textAlign = "center";
            const x = (overlay.x / 100) * canvas.width;
            const y = (overlay.y / 100) * canvas.height;
            ctx.fillText(overlay.text, x, y);
          }
        }

        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      const blob = await exportPromise;
      onSave(blob);
    } catch {
      // Export failed silently
    } finally {
      setIsExporting(false);
    }
  }, [trimRange, textOverlays, getFilterCSS, onSave]);

  const tabs = [
    { id: "trim" as const, icon: Scissors, label: "Recortar" },
    { id: "text" as const, icon: Type, label: "Texto" },
    { id: "filters" as const, icon: Wand2, label: "Filtros" },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Editor de Video
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isExporting}>
            <X size={14} className="mr-1" /> Cancelar
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <><Loader2 size={14} className="mr-1 animate-spin" /> Exportando...</>
            ) : (
              <><Check size={14} className="mr-1" /> Guardar</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        {/* Video preview */}
        <div className="flex-1 flex flex-col bg-black min-h-[200px] sm:min-h-0">
          <div className="flex-1 flex items-center justify-center relative">
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              style={{ filter: getFilterCSS() }}
              playsInline
              muted
              onClick={togglePlay}
            />

            {/* Text overlay preview */}
            {textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: `${overlay.fontSize}px`,
                  color: overlay.color,
                  fontFamily: overlay.fontFamily,
                  textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
                  display:
                    currentTime >= overlay.startTime && currentTime <= overlay.endTime
                      ? "block"
                      : "none",
                }}
              >
                {overlay.text}
              </div>
            ))}

            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20"
              >
                <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                  <Play size={24} className="text-white ml-1" fill="white" />
                </div>
              </button>
            )}
          </div>

          {/* Playback controls */}
          <div className="bg-gray-900 p-3 space-y-2">
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={duration || 1}
              step={0.1}
            />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <button onClick={togglePlay}>
                  {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
                </button>
                <button onClick={() => {
                  const v = videoRef.current;
                  if (v) { v.currentTime = trimRange.start; setCurrentTime(trimRange.start); }
                }}>
                  <RotateCcw size={14} className="text-white" />
                </button>
              </div>
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Tools panel */}
        <div className="w-full sm:w-72 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-950 overflow-y-auto max-h-[40vh] sm:max-h-none">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Trim tab */}
            {activeTab === "trim" && (
              <>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Recortar video
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Inicio</span>
                      <span>{formatTime(trimRange.start)}</span>
                    </div>
                    <Slider
                      value={[trimRange.start]}
                      onValueChange={([v]) => handleTrimChange("start", v)}
                      max={duration - 0.5}
                      step={0.1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Fin</span>
                      <span>{formatTime(trimRange.end)}</span>
                    </div>
                    <Slider
                      value={[trimRange.end]}
                      onValueChange={([v]) => handleTrimChange("end", v)}
                      min={0.5}
                      max={duration}
                      step={0.1}
                    />
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-center">
                    <span className="text-xs font-medium text-indigo-600">
                      Duración: {formatTime(trimRange.end - trimRange.start)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Text overlay tab */}
            {activeTab === "text" && (
              <>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Texto overlay
                </h3>
                <div className="space-y-3">
                  <input
                    className="input-base text-sm"
                    placeholder="Escribe tu texto..."
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    maxLength={100}
                  />
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Color</label>
                    <div className="flex gap-2">
                      {FONT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setTextColor(c)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-all",
                            textColor === c ? "border-indigo-500 scale-110" : "border-slate-300",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Tamaño</span>
                      <span>{textSize}px</span>
                    </div>
                    <Slider
                      value={[textSize]}
                      onValueChange={([v]) => setTextSize(v)}
                      min={16}
                      max={72}
                      step={2}
                    />
                  </div>
                  <Button size="sm" className="w-full" onClick={addTextOverlay} disabled={!editingText.trim()}>
                    Agregar texto
                  </Button>

                  {/* Existing overlays */}
                  {textOverlays.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500">Textos agregados</span>
                      {textOverlays.map((overlay) => (
                        <div key={overlay.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="text-xs truncate flex-1" style={{ color: overlay.color }}>
                            {overlay.text}
                          </span>
                          <button onClick={() => removeTextOverlay(overlay.id)} className="text-slate-400 hover:text-red-500 ml-2">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Filters tab */}
            {activeTab === "filters" && (
              <>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Filtros
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(FILTER_PRESETS) as [FilterPreset, { label: string; css: string }][]).map(
                    ([key, { label }]) => (
                      <button
                        key={key}
                        onClick={() => setFilterConfig((f) => ({ ...f, preset: key }))}
                        className={cn(
                          "p-2 rounded-lg text-xs font-medium text-center transition-all",
                          filterConfig.preset === key
                            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 ring-2 ring-indigo-500"
                            : "bg-white dark:bg-gray-800 text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>

                <div className="space-y-3 pt-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1"><Sun size={12} /> Brillo</span>
                      <span>{filterConfig.brightness}%</span>
                    </div>
                    <Slider
                      value={[filterConfig.brightness]}
                      onValueChange={([v]) => setFilterConfig((f) => ({ ...f, brightness: v }))}
                      min={50}
                      max={150}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1"><Contrast size={12} /> Contraste</span>
                      <span>{filterConfig.contrast}%</span>
                    </div>
                    <Slider
                      value={[filterConfig.contrast]}
                      onValueChange={([v]) => setFilterConfig((f) => ({ ...f, contrast: v }))}
                      min={50}
                      max={150}
                      step={1}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setFilterConfig({ brightness: 100, contrast: 100, preset: "original" })}
                  >
                    Resetear
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

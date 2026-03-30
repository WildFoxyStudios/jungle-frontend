"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Film,
  Clock,
  Volume2,
  VolumeX,
  Wand2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface VideoEditorProps {
  file: File;
  onSave: (editedFile: File, thumbnailBlob: Blob) => void;
  onCancel: () => void;
  className?: string;
}

interface TrimRange {
  start: number;
  end: number;
}

interface VideoFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

const DEFAULT_FILTERS: VideoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export function VideoEditor({ file, onSave, onCancel, className }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const thumbnailGenIdRef = useRef(0);
  const toast = useToast();
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 });
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"trim" | "filters">("trim");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trimError, setTrimError] = useState<string | null>(null);

  const checkBrowserSupport = useCallback(() => {
    if (typeof WebAssembly === "undefined") {
      throw new Error("Tu navegador no soporta WebAssembly. Usa Chrome, Firefox o Safari actualizado.");
    }
    if (typeof SharedArrayBuffer === "undefined") {
      throw new Error("Tu navegador no soporta SharedArrayBuffer. Recarga la página.");
    }
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL("@/lib/ffmpeg-worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event) => {
      const { type, progress: prog, error: workerError } = event.data;

      switch (type) {
        case "progress":
          setFfmpegProgress(prog);
          break;
        case "error":
          setError(workerError);
          setIsProcessing(false);
          toast.error(`Error: ${workerError}`);
          break;
      }
    };

    worker.onerror = (err) => {
      setError(`Worker error: ${err.message}`);
      setIsProcessing(false);
      toast.error("Error en el procesamiento");
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [toast]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      setDuration(video.duration);
      setTrimRange({ start: 0, end: video.duration });
      generateThumbnail(video.duration / 2);
    };

    video.ontimeupdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= trimRange.end) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = trimRange.start;
      }
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, trimRange.end, trimRange.start]);

  const generateThumbnail = useCallback((time: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clean up previous handler
    video.onseeked = null;

    // Increment generation ID
    const genId = ++thumbnailGenIdRef.current;
    const currentVideoTime = video.currentTime;
    video.currentTime = time;

    video.onseeked = () => {
      // Only process if this is still the latest generation
      if (genId !== thumbnailGenIdRef.current) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", 0.7);
      setThumbnailUrl(url);
      video.currentTime = currentVideoTime;
      video.onseeked = null; // Clean up after completion
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < trimRange.start || video.currentTime >= trimRange.end) {
        video.currentTime = trimRange.start;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, trimRange.start, trimRange.end]);

  const handleSeek = useCallback(([value]: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }, []);

  const handleTrimChange = useCallback(
    (type: "start" | "end", value: number) => {
      setTrimRange((prev) => {
        const newRange = { ...prev, [type]: value };

        // Enforce minimum duration of 0.5 seconds
        if (type === "start" && value >= newRange.end - 0.5) {
          newRange.start = Math.max(0, newRange.end - 0.5);
        } else if (type === "end" && value <= newRange.start + 0.5) {
          newRange.end = Math.min(duration, newRange.start + 0.5);
        }

        // Validate
        const trimDuration = newRange.end - newRange.start;
        if (trimDuration < 0.5) {
          setTrimError("La duración mínima es 0.5 segundos");
        } else {
          setTrimError(null);
        }

        return newRange;
      });

      const video = videoRef.current;
      if (video) {
        video.currentTime = value;
        setCurrentTime(value);
      }
    },
    [duration]
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const processVideo = useCallback(async () => {
    if (!workerRef.current) {
      toast.error("Worker no disponible");
      return;
    }

    setIsProcessing(true);
    setFfmpegProgress(0);
    setError(null);

    try {
      checkBrowserSupport();

      const worker = workerRef.current;
      const arrayBuffer = await file.arrayBuffer();
      const inputData = new Uint8Array(arrayBuffer);
      
      const inputFileName = `input_${Date.now()}.${file.name.split(".").pop()}`;
      const outputFileName = `output_${Date.now()}.mp4`;
      const trimDuration = trimRange.end - trimRange.start;

      await new Promise<void>((resolve, reject) => {
        const handleLoad = (event: MessageEvent) => {
          if (event.data.type === "loaded") {
            worker.removeEventListener("message", handleLoad);
            resolve();
          } else if (event.data.type === "error") {
            worker.removeEventListener("message", handleLoad);
            reject(new Error(event.data.error));
          }
        };
        worker.addEventListener("message", handleLoad);
        worker.postMessage({ type: "load" });
        setTimeout(() => {
          worker.removeEventListener("message", handleLoad);
          reject(new Error("Timeout cargando FFmpeg"));
        }, 30000);
      });

      const processedData = await new Promise<Uint8Array>((resolve, reject) => {
        const handleProcess = (event: MessageEvent) => {
          const { type, data, error: processError } = event.data;
          
          if (type === "completed") {
            worker.removeEventListener("message", handleProcess);
            resolve(data);
          } else if (type === "error") {
            worker.removeEventListener("message", handleProcess);
            reject(new Error(processError));
          }
        };
        
        worker.addEventListener("message", handleProcess);
        
        const trimOptions = [
          "-ss", `${trimRange.start}`,
          "-t", `${trimDuration}`,
          "-i", inputFileName,
          "-c:v", "libx264",
          "-preset", "medium",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-y",
          outputFileName,
        ];
        
        worker.postMessage({
          type: "transcode",
          payload: {
            inputFile: inputFileName,
            inputData,
            outputFile: outputFileName,
            options: trimOptions,
          },
        });
        
        setTimeout(() => {
          worker.removeEventListener("message", handleProcess);
          reject(new Error("Timeout procesando video"));
        }, 300000);
      });

      const videoArrayBuffer = new Uint8Array(processedData).buffer;
      const processedFile = new File(
        [videoArrayBuffer],
        `edited_${file.name.replace(/\.[^/.]+$/, "")}.mp4`,
        { type: "video/mp4" }
      );

      const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) {
          reject(new Error("No se pudo generar thumbnail"));
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo obtener contexto 2D"));
          return;
        }

        video.currentTime = trimRange.start + trimDuration / 2;
        
        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("No se pudo crear blob del thumbnail"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
      });

      onSave(processedFile, thumbnailBlob);
      toast.success("Video procesado exitosamente");
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      setFfmpegProgress(0);
    }
  }, [file, trimRange, checkBrowserSupport, onSave, toast]);

  const getVideoFilterStyle = useCallback(() => {
    return {
      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`,
    };
  }, [filters]);

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden relative", className)}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-[#1877f2]" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Editor de Video</span>
          <span className="text-sm text-gray-500">({formatTime(duration)})</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={processVideo}
            disabled={isProcessing || !!trimError}
            className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {ffmpegProgress}%
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-[#1877f2] animate-spin mx-auto" />
              <Film className="w-6 h-6 text-[#1877f2] absolute inset-0 m-auto" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Transcodificando video...</p>
              <p className="text-sm text-gray-500">Trim + MP4 (H.264) con FFmpeg.wasm</p>
            </div>
            <Progress value={ffmpegProgress} className="w-full sm:w-64" />
            <p className="text-sm text-[#1877f2] font-medium">{ffmpegProgress}%</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-black min-h-[200px] sm:min-h-0">
          <div className="flex-1 flex items-center justify-center relative">
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              style={getVideoFilterStyle()}
              muted={isMuted}
              playsInline
              onClick={togglePlay}
            />

            {!isPlaying && !isProcessing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </button>
            )}

            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-900 p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration}
                step={0.1}
                className="cursor-pointer"
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={togglePlay} 
                  className="text-white hover:bg-white/10"
                  disabled={isProcessing}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const video = videoRef.current;
                    if (video) {
                      video.currentTime = trimRange.start;
                      setCurrentTime(trimRange.start);
                    }
                  }}
                  className="text-white hover:bg-white/10"
                  disabled={isProcessing}
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>

              <div className="text-xs text-gray-400">
                Trim: {formatTime(trimRange.start)} - {formatTime(trimRange.end)}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 overflow-y-auto max-h-[40vh] sm:max-h-none">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {[
              { id: "trim", icon: Scissors, label: "Recortar" },
              { id: "filters", icon: Wand2, label: "Filtros" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-[#1877f2] border-b-2 border-[#1877f2] bg-[#e7f3ff] dark:bg-[#263951]"
                    : "text-[#65676b] hover:text-[#050505] dark:text-[#b0b3b8] dark:hover:text-[#e4e6eb]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-6">
            {activeTab === "trim" && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Seleccionar rango</h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Clock className="w-4 h-4" />
                        Inicio
                      </label>
                      <span className="text-xs text-gray-500">{formatTime(trimRange.start)}</span>
                    </div>
                    <Slider
                      value={[trimRange.start]}
                      onValueChange={([v]: number[]) => handleTrimChange("start", v)}
                      max={duration - 1}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Clock className="w-4 h-4" />
                        Fin
                      </label>
                      <span className="text-xs text-gray-500">{formatTime(trimRange.end)}</span>
                    </div>
                    <Slider
                      value={[trimRange.end]}
                      onValueChange={([v]: number[]) => handleTrimChange("end", v)}
                      min={1}
                      max={duration}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="p-3 bg-[#e7f3ff] dark:bg-[#263951] rounded-lg">
                    <p className="text-sm text-[#1877f2] font-medium">
                      Duración final: {formatTime(trimRange.end - trimRange.start)}
                    </p>
                  </div>

                  {trimError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {trimError}
                      </p>
                    </div>
                  )}
                </div>

                {thumbnailUrl && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail</h4>
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                  </div>
                )}
              </>
            )}

            {activeTab === "filters" && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Ajustes de video</h3>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠️ Los ajustes de brillo, contraste y saturación son solo de previsualización y no se aplican al video exportado.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Brillo</label>
                    <span className="text-xs text-gray-500">{filters.brightness}%</span>
                  </div>
                  <Slider
                    value={[filters.brightness]}
                    onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, brightness: v }))}
                    min={50}
                    max={150}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Contraste</label>
                    <span className="text-xs text-gray-500">{filters.contrast}%</span>
                  </div>
                  <Slider
                    value={[filters.contrast]}
                    onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, contrast: v }))}
                    min={50}
                    max={150}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Saturación</label>
                    <span className="text-xs text-gray-500">{filters.saturation}%</span>
                  </div>
                  <Slider
                    value={[filters.saturation]}
                    onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, saturation: v }))}
                    min={0}
                    max={200}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="w-full mt-4"
                  disabled={isProcessing}
                >
                  Resetear ajustes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default VideoEditor;

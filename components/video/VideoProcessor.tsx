"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Upload,
  Video,
  FileVideo,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Film,
  Image as ImageIcon,
  X,
} from "lucide-react";

// Tipos de estado del procesamiento
type ProcessingState =
  | "idle"
  | "validating"
  | "loading-ffmpeg"
  | "transcoding"
  | "extracting-thumbnail"
  | "completed"
  | "error";

interface ProcessedVideo {
  videoFile: File;
  thumbnailFile: File;
  originalSize: number;
  processedSize: number;
  duration: number;
}

interface VideoProcessorProps {
  onProcessed?: (result: ProcessedVideo) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // en bytes, por defecto 500MB
  acceptedFormats?: string[];
  className?: string;
}

// Constantes
const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/mpeg",
  "video/avi",
  "video/mov",
];

export function VideoProcessor({
  onProcessed,
  onError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFormats = ACCEPTED_VIDEO_FORMATS,
  className,
}: VideoProcessorProps) {
  const toast = useToast();
  const [state, setState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedVideo | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Verificar soporte del navegador
  const checkBrowserSupport = useCallback(() => {
    if (typeof WebAssembly === "undefined") {
      throw new Error("Tu navegador no soporta WebAssembly. Usa Chrome, Firefox o Safari.");
    }
    if (typeof SharedArrayBuffer === "undefined") {
      throw new Error(
        "Tu navegador no soporta SharedArrayBuffer. " +
        "Asegúrate de recargar la página. Si el problema persiste, contacta soporte."
      );
    }
  }, []);

  // Inicializar Web Worker
  useEffect(() => {
    // Crear el worker
    const worker = new Worker(
      new URL("../lib/ffmpeg-worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event) => {
      const { type, data, progress: workerProgress, error: workerError, outputFile } = event.data;

      switch (type) {
        case "loaded":
          setState("transcoding");
          setProgress(0);
          break;

        case "progress":
          setProgress(workerProgress);
          break;

        case "completed":
          handleProcessingComplete(data, outputFile);
          break;

        case "error":
          handleProcessingError(new Error(workerError));
          break;
      }
    };

    worker.onerror = (err) => {
      handleProcessingError(new Error(`Worker error: ${err.message}`));
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Validar archivo
  const validateFile = useCallback((file: File): boolean => {
    setState("validating");
    setError(null);

    // Verificar tipo
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato no soportado: ${file.type}. Usa MP4, WebM, MOV, AVI, etc.`);
      setState("error");
      return false;
    }

    // Verificar tamaño
    if (file.size > maxFileSize) {
      setError(`Archivo muy grande: ${formatFileSize(file.size)}. Máximo: ${formatFileSize(maxFileSize)}`);
      setState("error");
      return false;
    }

    return true;
  }, [acceptedFormats, maxFileSize]);

  // Manejar selección de archivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessedResult(null);
    setSelectedFile(file);
    
    // Crear preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    if (!validateFile(file)) {
      return;
    }

    // Iniciar procesamiento automáticamente
    processVideo(file);
  }, [validateFile]);

  // Procesar video
  const processVideo = useCallback(async (file: File) => {
    if (!workerRef.current) {
      handleProcessingError(new Error("Worker no inicializado"));
      return;
    }

    try {
      checkBrowserSupport();
      setState("loading-ffmpeg");
      setProgress(0);

      // Leer archivo como Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const inputData = new Uint8Array(arrayBuffer);

      // Nombres de archivos
      const inputFileName = `input_${Date.now()}.${getFileExtension(file.name)}`;
      const outputFileName = `output_${Date.now()}.mp4`;
      const thumbnailFileName = `thumb_${Date.now()}.jpg`;

      // Cargar FFmpeg y transcodificar
      workerRef.current.postMessage({
        type: "transcode",
        payload: {
          inputFile: inputFileName,
          inputData,
          outputFile: outputFileName,
          options: [],
        },
      });

      // Guardar referencia para cuando termine
      abortControllerRef.current = new AbortController();

    } catch (err) {
      handleProcessingError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [checkBrowserSupport]);

  // Manejar completado
  const handleProcessingComplete = useCallback(async (videoData: Uint8Array, outputFileName: string) => {
    if (!selectedFile || !workerRef.current) return;

    try {
      // Crear archivo de video procesado
      const videoArrayBuffer = new Uint8Array(videoData).buffer;
      const processedVideoFile = new File(
        [videoArrayBuffer],
        `processed_${selectedFile.name.replace(/\.[^/.]+$/, '')}.mp4`,
        { type: "video/mp4" }
      );

      // Extraer thumbnail
      setState("extracting-thumbnail");
      
      // Reiniciar worker para thumbnail
      const worker = workerRef.current;
      
      // Leer archivo original nuevamente para thumbnail
      const inputArrayBuffer = await selectedFile.arrayBuffer();
      const inputData = new Uint8Array(inputArrayBuffer);
      const thumbnailFileName = `thumb_${Date.now()}.jpg`;
      const inputFileName = `input_thumb_${Date.now()}.${getFileExtension(selectedFile.name)}`;

      // Crear promesa para esperar thumbnail
      const thumbnailPromise = new Promise<Uint8Array>((resolve, reject) => {
        const handleThumbMessage = (event: MessageEvent) => {
          const { type, data, error } = event.data;
          
          if (type === "completed") {
            worker.removeEventListener("message", handleThumbMessage);
            resolve(data);
          } else if (type === "error") {
            worker.removeEventListener("message", handleThumbMessage);
            reject(new Error(error));
          }
        };
        
        worker.addEventListener("message", handleThumbMessage);
        
        worker.postMessage({
          type: "extract-thumbnail",
          payload: {
            inputFile: inputFileName,
            inputData,
            outputFile: thumbnailFileName,
            timeSeconds: 1,
          },
        });
      });

      const thumbnailData = await thumbnailPromise;
      
      const thumbArrayBuffer = new Uint8Array(thumbnailData).buffer;
      const thumbnailFile = new File(
        [thumbArrayBuffer],
        `thumbnail_${selectedFile.name.replace(/\.[^/.]+$/, '')}.jpg`,
        { type: "image/jpeg" }
      );

      // Obtener duración del video
      const duration = await getVideoDuration(selectedFile);

      const result: ProcessedVideo = {
        videoFile: processedVideoFile,
        thumbnailFile,
        originalSize: selectedFile.size,
        processedSize: processedVideoFile.size,
        duration,
      };

      setProcessedResult(result);
      setState("completed");
      setProgress(100);

      toast.success("Video procesado exitosamente");
      onProcessed?.(result);

    } catch (err) {
      handleProcessingError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [selectedFile, onProcessed, toast]);

  // Manejar error
  const handleProcessingError = useCallback((err: Error) => {
    setState("error");
    setError(err.message);
    toast.error(`Error al procesar video: ${err.message}`);
    onError?.(err);
  }, [onError, toast]);

  // Cancelar procesamiento
  const handleCancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "abort" });
    }
    abortControllerRef.current?.abort();
    setState("idle");
    setProgress(0);
    setError(null);
  }, []);

  // Limpiar y resetear
  const handleReset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview(null);
    setProcessedResult(null);
    setState("idle");
    setProgress(0);
    setError(null);
  }, [preview]);

  // Determinar mensaje de estado
  const getStatusMessage = () => {
    switch (state) {
      case "validating":
        return "Validando archivo...";
      case "loading-ffmpeg":
        return "Cargando FFmpeg (esto puede tomar un momento)...";
      case "transcoding":
        return `Transcodificando video... ${progress}%`;
      case "extracting-thumbnail":
        return "Generando thumbnail...";
      case "completed":
        return "¡Procesamiento completado!";
      case "error":
        return "Error en el procesamiento";
      default:
        return "Selecciona un video para procesar";
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Área de drop/upload */}
      {state === "idle" && !selectedFile && (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Arrastra un video o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              MP4, WebM, MOV, AVI hasta {formatFileSize(maxFileSize)}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={acceptedFormats.join(",")}
            onChange={handleFileSelect}
          />
        </label>
      )}

      {/* Preview del video seleccionado */}
      {selectedFile && preview && (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            src={preview}
            className="w-full max-h-64 object-contain"
            controls={state === "completed"}
            muted
          />
          
          {/* Botón de cerrar */}
          {state !== "transcoding" && state !== "loading-ffmpeg" && state !== "extracting-thumbnail" && (
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Información del archivo */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm font-medium truncate">
              {selectedFile.name}
            </p>
            <p className="text-white/70 text-xs">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        </div>
      )}

      {/* Estado de procesamiento */}
      {state !== "idle" && state !== "completed" && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            {state === "error" ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : state === "loading-ffmpeg" ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : (
              <Film className="w-5 h-5 text-indigo-500" />
            )}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {getStatusMessage()}
            </span>
          </div>

          {(state === "transcoding" || state === "loading-ffmpeg") && (
            <Progress value={progress} className="h-2" />
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </p>
            </div>
          )}

          {(state === "transcoding" || state === "loading-ffmpeg" || state === "extracting-thumbnail") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="mt-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Cancelar procesamiento
            </Button>
          )}
        </div>
      )}

      {/* Resultado completado */}
      {processedResult && state === "completed" && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {getStatusMessage()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400 text-xs">Tamaño original</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {formatFileSize(processedResult.originalSize)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400 text-xs">Tamaño procesado</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {formatFileSize(processedResult.processedSize)}
                {processedResult.processedSize < processedResult.originalSize && (
                  <span className="text-green-500 ml-1 text-xs">
                    (-{Math.round((1 - processedResult.processedSize / processedResult.originalSize) * 100)}%)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Thumbnail */}
          {processedResult.thumbnailFile && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Thumbnail generado
              </p>
              <img
                src={URL.createObjectURL(processedResult.thumbnailFile)}
                alt="Thumbnail"
                className="w-32 h-20 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Información de compatibilidad */}
      {state === "error" && error?.includes("SharedArrayBuffer") && (
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
            Problema de compatibilidad detectado
          </h4>
          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
            <li>Recarga la página completamente (Ctrl+F5)</li>
            <li>Asegúrate de usar Chrome, Firefox o Safari actualizado</li>
            <li>Desactiva extensiones que puedan interferir</li>
            <li>Prueba en modo incógnito</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Funciones utilitarias
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}

export default VideoProcessor;

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { VideoEditor } from "./VideoEditor";
import { VideoProcessor } from "../video/VideoProcessor";
import { Upload, Video, X, Check, Loader2, Film, Scissors } from "lucide-react";

interface VideoUploaderEditorProps {
  onUpload: (result: {
    videoFile: File;
    thumbnailFile: File;
    originalSize: number;
    processedSize: number;
    duration: number;
  }) => void;
  onCancel?: () => void;
  initialFile?: File;
  maxFileSize?: number;
  className?: string;
}

type UploadState = "selecting" | "editing" | "processing" | "completed" | "error";

const ACCEPTED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/mpeg",
];

export function VideoUploaderEditor({
  onUpload,
  onCancel,
  initialFile,
  maxFileSize = 500 * 1024 * 1024, // 500MB
  className,
}: VideoUploaderEditorProps) {
  const toast = useToast();
  const [state, setState] = useState<UploadState>("selecting");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const processorRef = useRef<{ process: () => Promise<void> } | null>(null);

  // Si se recibe un archivo inicial, ir directamente a edición
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      setState("editing");
    }
  }, [initialFile]);

  // Seleccionar archivo
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validar tipo
      if (!ACCEPTED_VIDEO_FORMATS.includes(file.type)) {
        setError(`Formato no soportado: ${file.type}`);
        setState("error");
        toast.error("Formato de video no soportado");
        return;
      }

      // Validar tamaño
      if (file.size > maxFileSize) {
        setError(`Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        setState("error");
        toast.error(`Máximo ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`);
        return;
      }

      setSelectedFile(file);
      setEditedFile(null);
      setThumbnailBlob(null);
      setError(null);
      setState("editing");
    },
    [maxFileSize, toast]
  );

  // Guardar edición y pasar a procesamiento
  const handleEditSave = useCallback(
    async (file: File, thumbnail: Blob) => {
      setEditedFile(file);
      setThumbnailBlob(thumbnail);
      setState("processing");

      // Crear File del thumbnail
      const thumbnailFile = new File([thumbnail], `thumbnail_${file.name.replace(/\.[^/.]+$/, "")}.jpg`, {
        type: "image/jpeg",
      });

      // Obtener duración del video
      const video = document.createElement("video");
      video.preload = "metadata";
      const duration = await new Promise<number>((resolve) => {
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
        video.src = URL.createObjectURL(file);
      });

      setState("completed");

      // Llamar onUpload con el resultado
      onUpload({
        videoFile: file,
        thumbnailFile,
        originalSize: selectedFile?.size || file.size,
        processedSize: file.size,
        duration,
      });

      toast.success("Video procesado exitosamente");
    },
    [onUpload, toast, selectedFile]
  );

  // Cancelar edición
  const handleEditCancel = useCallback(() => {
    setState("selecting");
    setSelectedFile(null);
    setEditedFile(null);
    onCancel?.();
  }, [onCancel]);

  // Resetear todo
  const handleReset = useCallback(() => {
    setState("selecting");
    setSelectedFile(null);
    setEditedFile(null);
    setThumbnailBlob(null);
    setError(null);
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {state === "selecting" && (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#ced0d4] dark:border-[#3e4042] rounded-xl cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 rounded-full bg-[#e7f3ff] dark:bg-[#263951] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Film className="w-8 h-8 text-[#1877f2]" />
            </div>
            <p className="mb-1 text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
              Agregar video
            </p>
            <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
              o arrastra y suelta
            </p>
            <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-2">
              MP4, WebM, MOV, AVI hasta {(maxFileSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_VIDEO_FORMATS.join(",")}
            onChange={handleFileSelect}
          />
        </label>
      )}

      {state === "editing" && selectedFile && (
        <VideoEditor file={selectedFile} onSave={handleEditSave} onCancel={handleEditCancel} />
      )}

      {state === "processing" && (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-[#1877f2] animate-spin" />
            <Film className="w-6 h-6 text-[#1877f2] absolute inset-0 m-auto" />
          </div>
          <p className="text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">Procesando video...</p>
          <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">Preparando video para publicación</p>
        </div>
      )}

      {state === "completed" && editedFile && (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-6 bg-[#e7f3ff] dark:bg-[#263951] rounded-xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1877f2]/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-[#1877f2]" />
              </div>
              <p className="font-semibold text-[#050505] dark:text-[#e4e6eb] text-lg">¡Video listo!</p>
              <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
                Editado, transcodificado y comprimido
              </p>
            </div>
          </div>

          {/* Info del video */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg">
            <div>
              <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8]">Tamaño original</p>
              <p className="font-semibold text-[#050505] dark:text-[#e4e6eb]">{((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8]">Tamaño procesado</p>
              <p className="font-semibold text-[#050505] dark:text-[#e4e6eb]">{((editedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
              {editedFile && selectedFile && editedFile.size < selectedFile.size && (
                <p className="text-[12px] text-[#42b72a] font-medium">
                  -{Math.round((1 - editedFile.size / selectedFile.size) * 100)}% de compresión
                </p>
              )}
            </div>
          </div>

          {/* Preview del thumbnail */}
          {thumbnailBlob && (
            <div className="text-center">
              <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8] mb-2">Miniatura generada:</p>
              <img
                src={URL.createObjectURL(thumbnailBlob)}
                alt="Thumbnail"
                className="w-full max-w-xs mx-auto rounded-lg border border-[#ced0d4] dark:border-[#3e4042]"
              />
            </div>
          )}

          <Button
            onClick={handleReset}
            className="w-full bg-[#e4e6eb] dark:bg-[#3a3b3c] hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] text-[#050505] dark:text-[#e4e6eb] font-semibold"
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir otro video
          </Button>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#f3425f]/20 flex items-center justify-center">
            <X className="w-6 h-6 text-[#f3425f]" />
          </div>
          <p className="text-[15px] font-semibold text-[#f3425f]">{error || "Error al procesar"}</p>
          <Button onClick={handleReset} className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold">
            Intentar de nuevo
          </Button>
        </div>
      )}
    </div>
  );
}

export default VideoUploaderEditor;

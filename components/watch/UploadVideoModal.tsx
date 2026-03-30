"use client";

import { useState, useEffect, useRef } from "react";
import { Video, X, Upload, Loader2, Scissors } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { watchApi } from "@/lib/api-watch";
import { uploadApi, validateFile } from "@/lib/api-upload";
import { VideoEditorWatch } from "./VideoEditorWatch";
import { cn } from "@/lib/utils";

export interface UploadVideoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CATEGORIES = [
  "Entretenimiento",
  "Música",
  "Deportes",
  "Tecnología",
  "Cocina",
  "Viajes",
  "Educación",
  "Gaming",
  "Noticias",
  "Humor",
] as const;

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

interface UploadState {
  phase: "idle" | "uploading" | "creating" | "done" | "error";
  progress: number;
  uploadedUrl?: string;
  error?: string;
}

/**
 * Upload video modal with real R2 upload and blob URL lifecycle management.
 *
 * Fixes:
 * - useEffect cleanup with URL.revokeObjectURL()
 * - Revokes previous blob URL when selecting a new file
 * - Uploads to R2 via uploadApi.uploadPostMedia() before creating video
 * - Sends real R2 URL (not blob URL) to watchApi.createVideo()
 * - Validates file type and size with validateFile()
 */
export function UploadVideoModal({ open, onClose, onCreated }: UploadVideoModalProps) {
  const toast = useToast();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadState>({ phase: "idle", progress: 0 });
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    is_public: true,
    allow_comments: true,
  });

  // Track the latest preview URL for cleanup
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup blob URL on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;

    // Validate file
    try {
      validateFile(file, {
        allowedTypes: VIDEO_TYPES,
        maxSizeBytes: MAX_SIZE,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Archivo no válido");
      return;
    }

    // Revoke previous blob URL before creating a new one
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const newUrl = URL.createObjectURL(file);
    previewUrlRef.current = newUrl;
    setPreviewUrl(newUrl);
    setVideoFile(file);
    setUpload({ phase: "idle", progress: 0 });
  };

  const handleRemoveVideo = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setVideoFile(null);
    setShowEditor(false);
    setUpload({ phase: "idle", progress: 0 });
  };

  const handleEditorSave = (editedBlob: Blob) => {
    const editedFile = new File([editedBlob], videoFile?.name ?? "edited.webm", {
      type: "video/webm",
    });

    // Revoke old preview
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const newUrl = URL.createObjectURL(editedFile);
    previewUrlRef.current = newUrl;
    setPreviewUrl(newUrl);
    setVideoFile(editedFile);
    setShowEditor(false);
    toast.success("Video editado correctamente");
  };

  const handleUpload = async () => {
    if (!form.title.trim() || !videoFile) return;

    // Phase 1: Upload to R2
    setUpload({ phase: "uploading", progress: 10 });
    let r2Url: string;

    try {
      setUpload({ phase: "uploading", progress: 30 });
      const results = await uploadApi.uploadPostMedia(videoFile);
      setUpload({ phase: "uploading", progress: 80 });

      if (!results || results.length === 0) {
        throw new Error("No se recibió URL del servidor");
      }
      r2Url = results[0].url;
    } catch (err) {
      setUpload({
        phase: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Error al subir archivo",
      });
      toast.error("Error al subir el video a la nube");
      return;
    }

    // Phase 2: Create video record with real R2 URL
    setUpload({ phase: "creating", progress: 90, uploadedUrl: r2Url });

    try {
      await watchApi.createVideo({
        title: form.title.trim(),
        description: form.description || undefined,
        video_url: r2Url,
        duration: 0,
        category: form.category || undefined,
        is_public: form.is_public,
        allow_comments: form.allow_comments,
      });

      setUpload({ phase: "done", progress: 100, uploadedUrl: r2Url });
      toast.success("Video publicado exitosamente");
      onCreated?.();
      handleClose();
    } catch {
      setUpload((prev) => ({
        ...prev,
        phase: "error",
        error: "Error al crear el video",
      }));
      toast.error("Error al publicar el video");
    }
  };

  const handleClose = () => {
    // Cleanup on close
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setVideoFile(null);
    setShowEditor(false);
    setUpload({ phase: "idle", progress: 0 });
    setForm({
      title: "",
      description: "",
      category: "",
      is_public: true,
      allow_comments: true,
    });
    onClose();
  };

  const isBusy = upload.phase === "uploading" || upload.phase === "creating";
  const isValid = form.title.trim() && videoFile;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Subir video"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            loading={isBusy}
            disabled={!isValid || isBusy}
            leftIcon={<Video size={15} />}
          >
            {isBusy ? "Subiendo..." : "Publicar video"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Video upload zone */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Video <span className="text-red-500">*</span>
          </label>
          {previewUrl ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              {showEditor && videoFile ? (
                <div className="absolute inset-0 z-10">
                  <VideoEditorWatch
                    file={videoFile}
                    onSave={handleEditorSave}
                    onCancel={() => setShowEditor(false)}
                  />
                </div>
              ) : (
                <>
                  <video
                    src={previewUrl}
                    className="w-full h-full object-contain"
                    controls
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => setShowEditor(true)}
                      disabled={isBusy}
                      className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      title="Editar video"
                    >
                      <Scissors size={14} />
                    </button>
                    <button
                      onClick={handleRemoveVideo}
                      disabled={isBusy}
                      className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <label className="upload-zone block aspect-video flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => handleVideoSelect(e.target.files?.[0] ?? null)}
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                <Video size={28} className="text-indigo-500" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Arrastra tu video aquí
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                MP4, WebM o MOV · Máximo 100 MB
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                Seleccionar archivo
              </Button>
            </label>
          )}

          {/* Upload progress */}
          {isBusy && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                <span>
                  {upload.phase === "uploading"
                    ? "Subiendo video a la nube..."
                    : "Creando publicación..."}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-[width] duration-500"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {upload.phase === "error" && upload.error && (
            <p className="mt-2 text-sm text-red-500">{upload.error}</p>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Dale un título descriptivo a tu video"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-slate-400 text-right">
            {form.title.length}/200
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            placeholder="Cuéntale a los espectadores de qué trata tu video..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={5000}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="input-base cursor-pointer"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Video público
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Cualquiera puede ver y buscar este video
              </p>
            </div>
            <button
              role="switch"
              aria-checked={form.is_public}
              onClick={() => set("is_public", !form.is_public)}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors",
                form.is_public
                  ? "bg-indigo-600"
                  : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <span
                className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
                style={{
                  transform: form.is_public
                    ? "translateX(20px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Permitir comentarios
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Los espectadores podrán comentar en tu video
              </p>
            </div>
            <button
              role="switch"
              aria-checked={form.allow_comments}
              onClick={() => set("allow_comments", !form.allow_comments)}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors",
                form.allow_comments
                  ? "bg-indigo-600"
                  : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <span
                className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
                style={{
                  transform: form.allow_comments
                    ? "translateX(20px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ImageEditor } from "./ImageEditor";
import { compressImageToSizes, validateImageFile, ImageSizes } from "@/lib/image-compression";
import { Upload, ImageIcon, X, Check, Loader2, Wand2 } from "lucide-react";

interface ImageUploaderEditorProps {
  onUpload: (images: ImageSizes) => void;
  onCancel?: () => void;
  initialFile?: File;
  maxFileSize?: number;
  className?: string;
}

type UploadState = "selecting" | "editing" | "compressing" | "completed" | "error";

export function ImageUploaderEditor({
  onUpload,
  onCancel,
  initialFile,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className,
}: ImageUploaderEditorProps) {
  const toast = useToast();
  const [state, setState] = useState<UploadState>("selecting");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [compressedImages, setCompressedImages] = useState<ImageSizes | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      // Validar
      const validation = validateImageFile(file, maxFileSize);
      if (!validation.valid) {
        setError(validation.error || "Archivo inválido");
        setState("error");
        toast.error(validation.error || "Archivo inválido");
        return;
      }

      setSelectedFile(file);
      setEditedFile(null);
      setCompressedImages(null);
      setError(null);
      setState("editing");
    },
    [maxFileSize, toast]
  );

  // Guardar edición
  const handleEditSave = useCallback(
    async (file: File) => {
      setEditedFile(file);
      setState("compressing");

      try {
        // Comprimir a múltiples tamaños
        const sizes = await compressImageToSizes(file);

        setCompressedImages(sizes);
        setState("completed");

        toast.success("Imagen procesada exitosamente");
        onUpload(sizes);
      } catch (err) {
        setState("error");
        setError("Error al comprimir la imagen");
        toast.error("Error al procesar la imagen");
      }
    },
    [onUpload, toast]
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
    setCompressedImages(null);
    setError(null);
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {state === "selecting" && (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#ced0d4] dark:border-[#3e4042] rounded-xl cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 rounded-full bg-[#e7f3ff] dark:bg-[#263951] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-[#1877f2]" />
            </div>
            <p className="mb-1 text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">
              Agregar fotos
            </p>
            <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
              o arrastra y suelta
            </p>
            <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-2">
              JPG, PNG, WebP hasta {(maxFileSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
        </label>
      )}

      {state === "editing" && selectedFile && (
        <ImageEditor file={selectedFile} onSave={handleEditSave} onCancel={handleEditCancel} />
      )}

      {state === "compressing" && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-[#1877f2] animate-spin" />
            <ImageIcon className="w-5 h-5 text-[#1877f2] absolute inset-0 m-auto" />
          </div>
          <p className="text-[15px] font-semibold text-[#050505] dark:text-[#e4e6eb]">Procesando imagen...</p>
          <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">Optimizando para diferentes tamaños</p>
        </div>
      )}

      {state === "completed" && compressedImages && (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-[#e7f3ff] dark:bg-[#263951] rounded-xl">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1877f2]/20 flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-[#1877f2]" />
              </div>
              <p className="font-semibold text-[#050505] dark:text-[#e4e6eb]">¡Imagen lista!</p>
              <p className="text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
                {Object.keys(compressedImages).length} tamaños generados
              </p>
            </div>
          </div>

          {/* Preview de tamaños */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(compressedImages).map(([size, file]) => (
              <div key={size} className="text-center">
                <img
                  src={URL.createObjectURL(file)}
                  alt={size}
                  className="w-full aspect-square object-cover rounded-lg border border-[#ced0d4] dark:border-[#3e4042]"
                />
                <p className="text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-1 capitalize font-medium">{size}</p>
                <p className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ))}
          </div>

          <Button
            onClick={handleReset}
            className="w-full bg-[#e4e6eb] dark:bg-[#3a3b3c] hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] text-[#050505] dark:text-[#e4e6eb] font-semibold"
          >
            <Upload className="w-4 h-4 mr-2" />
            Seleccionar otra imagen
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

export default ImageUploaderEditor;

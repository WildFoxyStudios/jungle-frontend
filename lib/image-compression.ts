"use client";

import imageCompression from "browser-image-compression";

// Tamaños predefinidos para imágenes de red social
export interface ImageSizes {
  small: File; // Thumbnail (ej: 150x150)
  medium: File; // Preview (ej: 600x600)
  original: File; // Original comprimido
}

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  quality?: number;
  fileType?: string;
}

// Opciones por defecto para cada tamaño
const DEFAULT_SIZES: Record<keyof ImageSizes, CompressionOptions> = {
  small: {
    maxWidthOrHeight: 150,
    quality: 0.6,
    fileType: "image/jpeg",
  },
  medium: {
    maxWidthOrHeight: 600,
    quality: 0.8,
    fileType: "image/jpeg",
  },
  original: {
    maxWidthOrHeight: 2048,
    quality: 0.9,
    fileType: "image/jpeg",
  },
};

/**
 * Comprime una imagen generando tres tamaños: small, medium y original
 * @param file - Archivo de imagen original
 * @returns Promise con los tres tamaños generados
 */
export async function compressImageToSizes(file: File): Promise<ImageSizes> {
  // Validar que sea una imagen
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  const results: Partial<ImageSizes> = {};

  // Generar cada tamaño en paralelo
  const compressions = [
    { key: "small" as const, options: DEFAULT_SIZES.small },
    { key: "medium" as const, options: DEFAULT_SIZES.medium },
    { key: "original" as const, options: DEFAULT_SIZES.original },
  ];

  await Promise.all(
    compressions.map(async ({ key, options }) => {
      try {
        const compressedFile = await imageCompression(file, {
          maxWidthOrHeight: options.maxWidthOrHeight,
          initialQuality: options.quality,
          fileType: options.fileType,
          useWebWorker: true, // Usar Web Worker para no bloquear UI
          preserveExif: false, // No preservar EXIF para reducir tamaño
        });

        // Renombrar archivo con sufijo del tamaño
        const newName = file.name.replace(
          /(\.[a-zA-Z]+)$/,
          `_${key}$1`
        );

        results[key] = new File([compressedFile], newName, {
          type: compressedFile.type,
        });
      } catch (error) {
        console.error(`Error comprimiendo imagen para tamaño ${key}:`, error);
        // Si falla, usar el archivo original
        results[key] = file;
      }
    })
  );

  return results as ImageSizes;
}

/**
 * Comprime una sola imagen con opciones personalizadas
 * @param file - Archivo de imagen
 * @param options - Opciones de compresión
 * @returns Promise con el archivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  const compressionOptions = {
    maxWidthOrHeight: options.maxWidthOrHeight || 1200,
    initialQuality: options.quality || 0.8,
    fileType: options.fileType || "image/jpeg",
    useWebWorker: true,
    preserveExif: false,
  };

  try {
    const compressedBlob = await imageCompression(file, compressionOptions);
    return new File([compressedBlob], file.name, {
      type: compressedBlob.type,
    });
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    return file;
  }
}

/**
 * Usa Canvas API para redimensionar una imagen (alternativa a browser-image-compression)
 * @param file - Archivo de imagen
 * @param maxWidth - Ancho máximo
 * @param maxHeight - Alto máximo
 * @param quality - Calidad JPEG (0-1)
 * @returns Promise con Blob de la imagen redimensionada
 */
export async function resizeImageWithCanvas(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Crear canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener contexto 2D del canvas"));
        return;
      }

      // Usar better quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("No se pudo crear blob de la imagen"));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = url;
  });
}

/**
 * Genera un thumbnail cuadrado desde el centro de la imagen
 * @param file - Archivo de imagen
 * @param size - Tamaño del thumbnail (default 150)
 * @returns Promise con Blob del thumbnail
 */
export async function generateSquareThumbnail(
  file: File,
  size: number = 150
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calcular recorte cuadrado desde el centro
      const minDimension = Math.min(img.width, img.height);
      const sx = (img.width - minDimension) / 2;
      const sy = (img.height - minDimension) / 2;

      // Crear canvas cuadrado
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener contexto 2D del canvas"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Dibujar recorte cuadrado redimensionado
      ctx.drawImage(
        img,
        sx, sy, minDimension, minDimension, // Source (cuadrado central)
        0, 0, size, size // Dest (thumbnail)
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("No se pudo crear blob del thumbnail"));
          }
        },
        "image/jpeg",
        0.7
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = url;
  });
}

/**
 * Valida un archivo de imagen antes del procesamiento
 * @param file - Archivo a validar
 * @param maxSize - Tamaño máximo en bytes (default 10MB)
 * @returns Objeto con resultado de validación
 */
export function validateImageFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024
): { valid: boolean; error?: string } {
  // Verificar tipo
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "El archivo debe ser una imagen (JPEG, PNG, WebP, etc.)" };
  }

  // Verificar tamaño
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `La imagen es muy grande (${formatFileSize(file.size)}). Máximo: ${formatFileSize(maxSize)}`,
    };
  }

  // Verificar tipos soportados
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no soportado: ${file.type}. Usa JPEG, PNG, WebP o GIF.`,
    };
  }

  return { valid: true };
}

/**
 * Obtiene dimensiones de una imagen
 * @param file - Archivo de imagen
 * @returns Promise con width y height
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = url;
  });
}

// Función utilitaria para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default {
  compressImageToSizes,
  compressImage,
  resizeImageWithCanvas,
  generateSquareThumbnail,
  validateImageFile,
  getImageDimensions,
};

/**
 * Web Worker para procesamiento de video con FFmpeg.wasm
 * Este worker evita que el procesamiento de video bloquee el hilo principal (UI)
 */

import type { FFmpeg } from "@ffmpeg/ffmpeg";

// Tipos de mensajes entre el worker y el hilo principal
export interface WorkerMessage {
  type: "load" | "transcode" | "extract-thumbnail" | "abort";
  payload?: TranscodePayload | ThumbnailPayload;
}

export interface TranscodePayload {
  inputFile: string;
  inputData: Uint8Array;
  outputFile: string;
  options: string[];
}

export interface ThumbnailPayload {
  inputFile: string;
  inputData: Uint8Array;
  outputFile: string;
  timeSeconds: number;
}

export interface WorkerResponse {
  type: "loaded" | "progress" | "completed" | "error";
  data?: Uint8Array;
  progress?: number;
  error?: string;
  outputFile?: string;
}

// Variable para almacenar la instancia de FFmpeg
let ffmpegInstance: FFmpeg | null = null;
let isProcessing = false;

// URLs para los archivos de FFmpeg (mismas que en useFFmpeg)
const FFMPEG_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd";

/**
 * Cargar FFmpeg en el worker
 */
async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  // Importar FFmpeg dinámicamente
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();

  // Configurar callback de progreso
  ffmpeg.on("progress", ({ progress }) => {
    const percent = Math.round(progress * 100);
    self.postMessage({ type: "progress", progress: percent } as WorkerResponse);
  });

  // Cargar los archivos WASM
  const coreURL = await toBlobURL(
    `${FFMPEG_BASE_URL}/ffmpeg-core.js`,
    "text/javascript"
  );
  const wasmURL = await toBlobURL(
    `${FFMPEG_BASE_URL}/ffmpeg-core.wasm`,
    "application/wasm"
  );

  await ffmpeg.load({
    coreURL,
    wasmURL,
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Transcodificar video a MP4 (H.264)
 */
async function transcodeVideo(
  ffmpeg: FFmpeg,
  payload: TranscodePayload
): Promise<Uint8Array> {
  const { inputFile, inputData, outputFile, options } = payload;

  // Escribir archivo de entrada al sistema de archivos virtual de FFmpeg
  await ffmpeg.writeFile(inputFile, inputData);

  // Ejecutar comando FFmpeg
  // Opciones por defecto para H.264 con buena compatibilidad
  const defaultOptions = [
    "-i", inputFile,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
  ];

  const finalOptions = options.length > 0 ? options : defaultOptions;
  // Solo añadir outputFile si no está ya incluido en las opciones
  if (!finalOptions.includes(outputFile)) {
    finalOptions.push(outputFile);
  }

  await ffmpeg.exec(finalOptions);

  // Leer archivo de salida
  const data = await ffmpeg.readFile(outputFile);
  
  // Limpiar archivos temporales
  await ffmpeg.deleteFile(inputFile);
  await ffmpeg.deleteFile(outputFile);

  return data as Uint8Array;
}

/**
 * Extraer thumbnail del video
 */
async function extractThumbnail(
  ffmpeg: FFmpeg,
  payload: ThumbnailPayload
): Promise<Uint8Array> {
  const { inputFile, inputData, outputFile, timeSeconds } = payload;

  // Escribir archivo de entrada
  await ffmpeg.writeFile(inputFile, inputData);

  // Extraer frame en el tiempo especificado
  await ffmpeg.exec([
    "-i", inputFile,
    "-ss", `${timeSeconds}`,
    "-vframes", "1",
    "-q:v", "2",
    "-y",
    outputFile,
  ]);

  // Leer thumbnail
  const data = await ffmpeg.readFile(outputFile);

  // Limpiar
  await ffmpeg.deleteFile(inputFile);
  await ffmpeg.deleteFile(outputFile);

  return data as Uint8Array;
}

// Manejador de mensajes del worker
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case "load": {
        await loadFFmpeg();
        self.postMessage({ type: "loaded" } as WorkerResponse);
        break;
      }

      case "transcode": {
        if (isProcessing) {
          throw new Error("Ya hay un proceso en curso");
        }
        isProcessing = true;

        const ffmpeg = await loadFFmpeg();
        const data = await transcodeVideo(ffmpeg, payload as TranscodePayload);

        self.postMessage({
          type: "completed",
          data,
          outputFile: (payload as TranscodePayload).outputFile,
        } as WorkerResponse);
        break;
      }

      case "extract-thumbnail": {
        if (isProcessing) {
          throw new Error("Ya hay un proceso en curso");
        }
        isProcessing = true;

        const ffmpeg = await loadFFmpeg();
        const data = await extractThumbnail(ffmpeg, payload as ThumbnailPayload);

        self.postMessage({
          type: "completed",
          data,
          outputFile: (payload as ThumbnailPayload).outputFile,
        } as WorkerResponse);
        break;
      }

      case "abort": {
        isProcessing = false;
        // FFmpeg no tiene un método de aborto directo,
        // pero podemos reiniciar la instancia si es necesario
        if (ffmpegInstance) {
          ffmpegInstance = null;
        }
        break;
      }

      default:
        throw new Error(`Tipo de mensaje desconocido: ${type}`);
    }
  } catch (error) {
    isProcessing = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({
      type: "error",
      error: errorMessage,
    } as WorkerResponse);
  } finally {
    if (type !== "load") {
      isProcessing = false;
    }
  }
};

export {};

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// URLs para los archivos de FFmpeg.wasm (versión 0.12.x)
const FFMPEG_BASE_URL = "https://app.unpkg.com/@ffmpeg/core@0.12.4/files/dist/umd";

export interface FFmpegState {
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  progress: number;
  ready: boolean;
}

export interface FFmpegResult {
  ffmpeg: FFmpeg | null;
  state: FFmpegState;
  load: () => Promise<void>;
  supportsSharedArrayBuffer: boolean;
  supportsWASM: boolean;
}

/**
 * Hook personalizado para cargar y usar FFmpeg.wasm de forma asíncrona.
 * Solo carga FFmpeg cuando se necesita (lazy loading).
 */
export function useFFmpeg(): FFmpegResult {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [state, setState] = useState<FFmpegState>({
    loaded: false,
    loading: false,
    error: null,
    progress: 0,
    ready: false,
  });

  // Verificar soporte del navegador
  const supportsSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
  const supportsWASM = typeof WebAssembly !== "undefined";

  // Verificar si el navegador soporta las APIs necesarias
  const checkBrowserSupport = useCallback(() => {
    if (!supportsWASM) {
      throw new Error("Tu navegador no soporta WebAssembly (WASM). Usa un navegador moderno como Chrome, Firefox o Safari.");
    }
    if (!supportsSharedArrayBuffer) {
      throw new Error(
        "Tu navegador no soporta SharedArrayBuffer. " +
        "Asegúrate de que la página se sirva con los headers COOP/COEP correctos. " +
        "Prueba recargar la página o usa un navegador más reciente."
      );
    }
  }, [supportsSharedArrayBuffer, supportsWASM]);

  // Cargar FFmpeg
  const load = useCallback(async () => {
    // Si ya está cargado, no hacer nada
    if (ffmpegRef.current && state.loaded) {
      return;
    }

    // Si ya está cargando, esperar
    if (state.loading) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar soporte del navegador
      checkBrowserSupport();

      // Crear instancia de FFmpeg
      const ffmpeg = new FFmpeg();

      // Configurar callback de progreso
      ffmpeg.on("progress", ({ progress, time }) => {
        const percent = Math.round(progress * 100);
        setState((prev) => ({ ...prev, progress: percent }));
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

      // Inicializar FFmpeg
      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      ffmpegRef.current = ffmpeg;
      setState({
        loaded: true,
        loading: false,
        error: null,
        progress: 100,
        ready: true,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
        ready: false,
      }));
      throw error;
    }
  }, [checkBrowserSupport, state.loaded, state.loading]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      // FFmpeg no tiene un método de limpieza explícito,
      // pero podemos eliminar la referencia
      ffmpegRef.current = null;
    };
  }, []);

  return {
    ffmpeg: ffmpegRef.current,
    state,
    load,
    supportsSharedArrayBuffer,
    supportsWASM,
  };
}

export default useFFmpeg;

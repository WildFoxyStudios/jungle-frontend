"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Droplets,
  Crop,
  Check,
  X,
  Download,
  Undo,
  Redo,
  Wand2,
  Type,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
  className?: string;
}

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
}

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
};

const PRESET_FILTERS = {
  normal: DEFAULT_FILTERS,
  grayscale: { ...DEFAULT_FILTERS, grayscale: 100 },
  sepia: { ...DEFAULT_FILTERS, sepia: 100 },
  vintage: { ...DEFAULT_FILTERS, sepia: 50, contrast: 120, brightness: 90 },
  cold: { ...DEFAULT_FILTERS, hueRotate: 180, brightness: 110 },
  warm: { ...DEFAULT_FILTERS, hueRotate: 30, brightness: 110, saturation: 120 },
  highContrast: { ...DEFAULT_FILTERS, contrast: 150 },
};

export function ImageEditor({ file, onSave, onCancel, className }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  const [activeTab, setActiveTab] = useState<"filters" | "adjust" | "crop">("filters");
  const [isDragging, setIsDragging] = useState(false);
  const [textOverlay, setTextOverlay] = useState<{ text: string; x: number; y: number; color: string } | null>(null);
  const [cropRatio, setCropRatio] = useState<string | null>(null);

  // Guardar estado para undo/redo — defined early because applyCrop and useEffect depend on it
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(imageData);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, []); // No dependencies - stable reference

  // Aspect ratio presets for crop
  const CROP_RATIOS: { label: string; value: string; ratio: number | null }[] = [
    { label: "Libre", value: "free", ratio: null },
    { label: "1:1", value: "1:1", ratio: 1 },
    { label: "4:3", value: "4:3", ratio: 4 / 3 },
    { label: "3:4", value: "3:4", ratio: 3 / 4 },
    { label: "16:9", value: "16:9", ratio: 16 / 9 },
    { label: "9:16", value: "9:16", ratio: 9 / 16 },
  ];

  // Apply crop to the image
  const applyCrop = useCallback((ratio: number | null) => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgW = originalImage.width;
    const imgH = originalImage.height;

    let cropW = imgW;
    let cropH = imgH;

    if (ratio !== null) {
      const currentRatio = imgW / imgH;
      if (currentRatio > ratio) {
        // Image is wider than target ratio - crop width
        cropW = Math.round(imgH * ratio);
        cropH = imgH;
      } else {
        // Image is taller than target ratio - crop height
        cropW = imgW;
        cropH = Math.round(imgW / ratio);
      }
    }

    const sx = Math.round((imgW - cropW) / 2);
    const sy = Math.round((imgH - cropH) / 2);

    // Create a temporary canvas to hold the cropped image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.drawImage(originalImage, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

    // Create new image from cropped canvas
    const croppedImg = new Image();
    croppedImg.onload = () => {
      setOriginalImage(croppedImg);
      canvas.width = cropW;
      canvas.height = cropH;
      ctx.drawImage(croppedImg, 0, 0);
      saveToHistory();
    };
    croppedImg.src = tempCanvas.toDataURL("image/jpeg", 0.95);
  }, [originalImage, saveToHistory]);

  // Cargar imagen
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          saveToHistory();
        }
      }
    };
    img.src = url;
    // Don't revoke in cleanup — React Strict Mode double-invokes effects,
    // revoking on first cleanup causes ERR_FILE_NOT_FOUND on second mount.
    // The URL will be garbage collected when the component fully unmounts.
  }, [file, saveToHistory]);

  // Aplicar filtros y transformaciones
  const applyFilters = useCallback(() => {
    if (!canvasRef.current || !originalImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Guardar estado
    ctx.save();

    // Aplicar transformaciones
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-centerX, -centerY);

    // Aplicar filtros CSS
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      hue-rotate(${filters.hueRotate}deg)
    `;

    // Dibujar imagen
    ctx.drawImage(originalImage, 0, 0);

    // Restaurar estado
    ctx.restore();

    // Dibujar texto si existe
    if (textOverlay) {
      ctx.save();
      ctx.font = "bold 48px Arial";
      ctx.fillStyle = textOverlay.color;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.textAlign = "center";
      ctx.strokeText(textOverlay.text, textOverlay.x, textOverlay.y);
      ctx.fillText(textOverlay.text, textOverlay.x, textOverlay.y);
      ctx.restore();
    }
  }, [originalImage, filters, rotation, flipH, flipV, textOverlay]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.putImageData(historyRef.current[newIndex], 0, 0);
      }
    }
  }, []);

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.putImageData(historyRef.current[newIndex], 0, 0);
      }
    }
  }, []);

  // Rotar
  const rotate = useCallback((direction: "cw" | "ccw") => {
    setRotation((prev) => prev + (direction === "cw" ? 90 : -90));
  }, []);

  // Aplicar filtro preset
  const applyPreset = useCallback((preset: keyof typeof PRESET_FILTERS) => {
    setFilters(PRESET_FILTERS[preset]);
  }, []);

  // Resetear filtros
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setTextOverlay(null);
  }, []);

  // Guardar imagen editada
  const saveImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure canvas reflects all current changes before exporting
    applyFilters();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const editedFile = new File([blob], `edited_${file.name}`, {
            type: "image/jpeg",
          });
          onSave(editedFile);
        }
      },
      "image/jpeg",
      0.95
    );
  }, [file.name, onSave, applyFilters]);

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handler para agregar texto
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const text = prompt("Ingresa el texto:");
      if (text) {
        setTextOverlay({ text, x, y, color: "#ffffff" });
      }
      setIsDragging(false);
    },
    [isDragging]
  );

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden", className)}>
      {/* Header con toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          <Button variant="ghost" size="icon" onClick={() => rotate("ccw")}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => rotate("cw")}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlipH(!flipH)}
            className={flipH ? "bg-[#e7f3ff] dark:bg-[#263951]" : ""}
          >
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlipV(!flipV)}
            className={flipV ? "bg-[#e7f3ff] dark:bg-[#263951]" : ""}
          >
            <FlipVertical className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDragging(true)}
            className={isDragging ? "bg-[#e7f3ff] dark:bg-[#263951]" : ""}
            title="Agregar texto"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetFilters}>
            Resetear
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={saveImage} className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold">
            <Check className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4 overflow-auto min-h-[200px] sm:min-h-0">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="max-w-full max-h-full shadow-lg cursor-crosshair"
            style={{ imageRendering: "auto" }}
          />
        </div>

        {/* Sidebar con controles */}
        <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 overflow-y-auto max-h-[40vh] sm:max-h-none">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {[
              { id: "filters", icon: Wand2, label: "Filtros" },
              { id: "adjust", icon: Sun, label: "Ajustes" },
              { id: "crop", icon: Crop, label: "Recortar" },
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

          {/* Contenido del tab */}
          <div className="p-4 space-y-4">
            {activeTab === "filters" && (
              <>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Filtros predefinidos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PRESET_FILTERS).map(([name, filter]) => (
                    <button
                      key={name}
                      onClick={() => applyPreset(name as keyof typeof PRESET_FILTERS)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#1877f2] transition-colors"
                    >
                      <div
                        className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{
                          filter: `
                            brightness(${filter.brightness}%)
                            contrast(${filter.contrast}%)
                            saturate(${filter.saturation}%)
                            grayscale(${filter.grayscale}%)
                            sepia(${filter.sepia}%)
                            hue-rotate(${filter.hueRotate}deg)
                          `,
                        }}
                      >
                        {name === "normal" && "Normal"}
                        {name === "grayscale" && "B&N"}
                        {name === "sepia" && "Sepia"}
                        {name === "vintage" && "Vintage"}
                        {name === "cold" && "Frío"}
                        {name === "warm" && "Cálido"}
                        {name === "highContrast" && "Alto contraste"}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === "adjust" && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Sun className="w-4 h-4" />
                        Brillo
                      </label>
                      <span className="text-xs text-gray-500">{filters.brightness}%</span>
                    </div>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, brightness: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Contrast className="w-4 h-4" />
                        Contraste
                      </label>
                      <span className="text-xs text-gray-500">{filters.contrast}%</span>
                    </div>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, contrast: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Droplets className="w-4 h-4" />
                        Saturación
                      </label>
                      <span className="text-xs text-gray-500">{filters.saturation}%</span>
                    </div>
                    <Slider
                      value={[filters.saturation]}
                      onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, saturation: v }))}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700 dark:text-gray-300">Desenfoque</label>
                      <span className="text-xs text-gray-500">{filters.blur}px</span>
                    </div>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, blur: v }))}
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700 dark:text-gray-300">Tono</label>
                      <span className="text-xs text-gray-500">{filters.hueRotate}°</span>
                    </div>
                    <Slider
                      value={[filters.hueRotate]}
                      onValueChange={([v]: number[]) => setFilters((f) => ({ ...f, hueRotate: v }))}
                      min={0}
                      max={360}
                      step={1}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "crop" && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recortar imagen</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Selecciona una proporción para recortar desde el centro de la imagen.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CROP_RATIOS.map((crop) => (
                    <button
                      key={crop.value}
                      onClick={() => {
                        setCropRatio(crop.value);
                        if (crop.ratio !== null) {
                          applyCrop(crop.ratio);
                        }
                      }}
                      className={cn(
                        "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border",
                        cropRatio === crop.value
                          ? "bg-[#e7f3ff] dark:bg-[#263951] border-[#1877f2] text-[#1877f2]"
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {crop.label}
                    </button>
                  ))}
                </div>
                {cropRatio && cropRatio !== "free" && (
                  <div className="p-3 bg-[#e7f3ff] dark:bg-[#263951] rounded-lg">
                    <p className="text-sm text-[#1877f2] font-medium">
                      Recortado a {cropRatio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageEditor;

"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Tv, 
  Music, 
  Trophy, 
  Cpu, 
  ChefHat, 
  Plane, 
  GraduationCap, 
  Gamepad2, 
  Newspaper, 
  Laugh,
  LayoutGrid
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORIES: CategoryItem[] = [
  { value: "", label: "Todos", icon: LayoutGrid },
  { value: "Entretenimiento", label: "Entretenimiento", icon: Tv },
  { value: "Música", label: "Musica", icon: Music },
  { value: "Deportes", label: "Deportes", icon: Trophy },
  { value: "Tecnología", label: "Tech", icon: Cpu },
  { value: "Cocina", label: "Cocina", icon: ChefHat },
  { value: "Viajes", label: "Viajes", icon: Plane },
  { value: "Educación", label: "Educacion", icon: GraduationCap },
  { value: "Gaming", label: "Gaming", icon: Gamepad2 },
  { value: "Noticias", label: "Noticias", icon: Newspaper },
  { value: "Humor", label: "Humor", icon: Laugh },
];

export interface CategoryChipsProps {
  selected: string;
  onSelect: (category: string) => void;
}

/**
 * Horizontal scrollable category chips for filtering Watch videos.
 * Includes icons for visual appeal and auto-scrolls to selected chip.
 */
export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected chip when it changes
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const chip = selectedRef.current;
      const containerRect = container.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      
      // Check if chip is outside visible area
      if (chipRect.left < containerRect.left || chipRect.right > containerRect.right) {
        chip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selected]);

  return (
    <div 
      ref={containerRef}
      className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
      role="tablist"
      aria-label="Filtrar por categoria"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selected === cat.value;
        
        return (
          <button
            key={cat.value}
            ref={isSelected ? selectedRef : null}
            onClick={() => onSelect(cat.value)}
            role="tab"
            aria-selected={isSelected}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
              isSelected
                ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 shadow-md scale-[1.02]"
                : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700 hover:scale-[1.02]",
            )}
          >
            <Icon size={14} className="shrink-0" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

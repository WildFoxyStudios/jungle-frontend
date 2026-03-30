"use client";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "Entretenimiento", label: "Entretenimiento" },
  { value: "Música", label: "Música" },
  { value: "Deportes", label: "Deportes" },
  { value: "Tecnología", label: "Tecnología" },
  { value: "Cocina", label: "Cocina" },
  { value: "Viajes", label: "Viajes" },
  { value: "Educación", label: "Educación" },
  { value: "Gaming", label: "Gaming" },
  { value: "Noticias", label: "Noticias" },
  { value: "Humor", label: "Humor" },
] as const;

export interface CategoryChipsProps {
  selected: string;
  onSelect: (category: string) => void;
}

/**
 * Horizontal scrollable category chips for filtering Watch videos.
 */
export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
            selected === cat.value
              ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 shadow-sm"
              : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700",
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

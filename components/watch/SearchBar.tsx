"use client";

import { Search, X } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Search field with Search icon and clear button for Watch.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="search"
        placeholder="Buscar videos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base pl-10 pr-9 w-full"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

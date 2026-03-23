"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: never;
}
interface DropdownSeparator {
  separator: true;
  label?: never;
  icon?: never;
  onClick?: never;
  danger?: never;
  disabled?: never;
}
type DropdownOption = DropdownItem | DropdownSeparator;

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownOption[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(v => !v)}>{trigger}</div>
      {open && (
        <div className={cn(
          "absolute top-full mt-1 z-40 min-w-[180px]",
          "bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700",
          "shadow-lg py-1 animate-fade-in-down",
          align === "right" ? "right-0" : "left-0",
        )}>
          {items.map((item, i) => {
            if ("separator" in item && item.separator) {
              return <hr key={i} className="my-1 border-slate-200 dark:border-slate-700" />;
            }
            return (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left",
                  "transition-colors",
                  item.danger
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60",
                  item.disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

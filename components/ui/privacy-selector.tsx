"use client";

import { Globe, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "public", label: "Público", desc: "Cualquier persona", icon: Globe },
  { value: "friends", label: "Amigos", desc: "Solo tus amigos", icon: Users },
  { value: "only_me", label: "Solo yo", desc: "Solo tú puedes ver", icon: Lock },
] as const;

type PrivacyValue = "public" | "friends" | "only_me";

interface PrivacySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
}

export function PrivacySelector({ value, onChange, className, compact = false }: PrivacySelectorProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.label}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                active
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
              active
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700",
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              active
                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500",
            )}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold",
                active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-100",
              )}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
              active ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600",
            )}>
              {active && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

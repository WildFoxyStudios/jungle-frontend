import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
  showLabel?: boolean;
  className?: string;
}

const heights = { sm: "h-1", md: "h-2", lg: "h-3" };
const colors = {
  primary: "bg-indigo-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-red-500",
};

export function Progress({ value, max = 100, size = "md", color = "primary", showLabel, className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colors[color])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

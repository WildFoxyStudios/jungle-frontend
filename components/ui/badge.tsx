import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}

const variants = {
  default:  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  primary:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  success:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  warning:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  danger:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  outline:  "border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300",
};

const sizeClass = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-2.5 py-1",
};

export function Badge({ children, variant = "default", size = "md", dot, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium rounded-full", variants[variant], sizeClass[size], className)}>
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-slate-500": variant === "default",
          "bg-indigo-500": variant === "primary",
          "bg-green-500": variant === "success",
          "bg-amber-500": variant === "warning",
          "bg-red-500": variant === "danger",
        })} />
      )}
      {children}
    </span>
  );
}

interface NotifBadgeProps {
  count: number;
  className?: string;
}

export function NotifBadge({ count, className }: NotifBadgeProps) {
  if (count <= 0) return null;
  return (
    <span className={cn(
      "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
      "flex items-center justify-center",
      "bg-red-500 text-white text-[10px] font-bold rounded-full",
      "ring-2 ring-white dark:ring-gray-900",
      className,
    )}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

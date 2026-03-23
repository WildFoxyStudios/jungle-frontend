"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  loading?: boolean;
  rounded?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:   "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost:     "btn btn-ghost",
  danger:    "btn btn-danger",
  outline:   "btn border border-slate-300 dark:border-slate-600 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[10px] px-5 py-2.5 text-[0.9375rem]",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm:   "btn-sm",
  md:   "",
  lg:   "btn-lg",
  xl:   "btn-xl",
  icon: "btn-icon",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, rounded, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          variants[variant],
          sizeClass[size],
          rounded && "btn-rounded",
          loading && "opacity-70 cursor-not-allowed",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

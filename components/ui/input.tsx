"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-base",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "error",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-400">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={`${inputId}-helper`} className="text-xs text-slate-500">{helper}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

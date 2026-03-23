"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  wrapperClassName?: string;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, wrapperClassName, className, autoResize, id, onChange, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }
      onChange?.(e);
    };

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn("input-base resize-none", error && "error", className)}
          aria-invalid={!!error}
          onChange={handleChange}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {!error && helper && <p className="text-xs text-slate-500">{helper}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

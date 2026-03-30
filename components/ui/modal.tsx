"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  hideClose?: boolean;
  footer?: ReactNode;
}

const sizes = {
  sm:   "max-w-[95vw] sm:max-w-sm",
  md:   "max-w-[95vw] sm:max-w-lg",
  lg:   "max-w-[95vw] sm:max-w-2xl",
  xl:   "max-w-[95vw] sm:max-w-4xl",
  full: "max-w-[100vw] sm:max-w-[95vw] max-h-[95vh]",
};

export function Modal({ open, onClose, title, children, size = "md", className, hideClose, footer }: ModalProps) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative w-full bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl animate-fade-in-scale",
          "flex flex-col max-h-[90vh] rounded-t-2xl sm:rounded-2xl",
          sizes[size],
          className,
        )}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
            {title && (
              <h2 id="modal-title" className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

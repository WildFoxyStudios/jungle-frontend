"use client";

import { createContext, useCallback, useContext, useReducer, type ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function toastReducer(state: Toast[], action: { type: "add"; toast: Toast } | { type: "remove"; id: string }) {
  if (action.type === "add") return [...state.slice(-4), action.toast];
  return state.filter(t => t.id !== action.id);
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
};

const styles: Record<ToastType, string> = {
  success: "bg-white dark:bg-gray-800 border-l-4 border-l-emerald-500",
  error:   "bg-white dark:bg-gray-800 border-l-4 border-l-red-500",
  warning: "bg-white dark:bg-gray-800 border-l-4 border-l-amber-500",
  info:    "bg-white dark:bg-gray-800 border-l-4 border-l-blue-500",
};

const iconStyles: Record<ToastType, string> = {
  success: "text-emerald-500",
  error:   "text-red-500",
  warning: "text-amber-500",
  info:    "text-blue-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const dismiss = useCallback((id: string) => dispatch({ type: "remove", id }), []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: "add", toast: { id, type, message, duration } });
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const ctx = {
    toast,
    success: (m: string) => toast(m, "success"),
    error:   (m: string) => toast(m, "error"),
    warning: (m: string) => toast(m, "warning"),
    info:    (m: string) => toast(m, "info"),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-20 sm:bottom-4 right-2 sm:right-4 left-2 sm:left-auto z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl",
              "min-w-[280px] max-w-sm",
              "animate-notif-slide",
              styles[t.type],
            )}
          >
            <span className={cn("mt-0.5 shrink-0", iconStyles[t.type])}>{icons[t.type]}</span>
            <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave?: (value: string) => Promise<void> | void;
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  multiline?: boolean;
  maxLength?: number;
  type?: "text" | "email" | "tel" | "url" | "date";
  className?: string;
  disabled?: boolean;
  emptyText?: string;
}

export function InlineEdit({
  value,
  onSave,
  placeholder,
  label,
  icon,
  multiline = false,
  maxLength,
  type = "text",
  className,
  disabled = false,
  emptyText = "Agregar...",
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const handleSave = async () => {
    if (draft.trim() === value || !onSave) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        {icon && <span className="mt-2.5 shrink-0 text-slate-400">{icon}</span>}
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          )}
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={3}
              className="input-base resize-none w-full text-sm"
              disabled={saving}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className="input-base w-full text-sm"
              disabled={saving}
            />
          )}
          {maxLength && (
            <p className="text-[10px] text-slate-400 text-right mt-0.5">
              {draft.length}/{maxLength}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            title="Guardar"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            title="Cancelar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className={cn(
        "group w-full flex items-center gap-2 text-left rounded-lg p-2 -m-2 transition-colors",
        !disabled && "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
        disabled && "cursor-default",
        className,
      )}
    >
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        )}
        <p className={cn(
          "text-sm truncate",
          value
            ? "text-slate-800 dark:text-slate-100"
            : "text-slate-400 dark:text-slate-500 italic",
        )}>
          {value || emptyText}
        </p>
      </div>
      {!disabled && (
        <Pencil
          size={14}
          className="shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </button>
  );
}

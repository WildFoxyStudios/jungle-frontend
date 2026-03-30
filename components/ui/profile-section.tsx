"use client";

import { useState, type ReactNode } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  className?: string;
  editable?: boolean;
}

export function ProfileSection({
  title,
  icon,
  children,
  onAdd,
  addLabel = "Agregar",
  collapsible = false,
  defaultOpen = true,
  isEmpty = false,
  emptyText = "No hay información",
  className,
  editable = true,
}: ProfileSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("surface p-4 sm:p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={collapsible ? () => setOpen((v) => !v) : undefined}
          className={cn(
            "flex items-center gap-2",
            collapsible && "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
          )}
        >
          {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            {title}
          </h3>
          {collapsible && (
            open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>
        {editable && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">{addLabel}</span>
          </button>
        )}
      </div>

      {/* Content */}
      {(!collapsible || open) && (
        <>
          {isEmpty ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-3 text-center">
              {emptyText}
            </p>
          ) : (
            <div className="space-y-1">{children}</div>
          )}
        </>
      )}
    </div>
  );
}

interface ProfileItemProps {
  icon?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ProfileItem({ icon, primary, secondary, onEdit, onDelete, className }: ProfileItemProps) {
  return (
    <div className={cn(
      "group flex items-start gap-3 p-2 -mx-2 rounded-lg transition-colors",
      (onEdit || onDelete) && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
      className,
    )}>
      {icon && <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-800 dark:text-slate-100">{primary}</div>
        {secondary && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{secondary}</div>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-xs font-medium"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-medium"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

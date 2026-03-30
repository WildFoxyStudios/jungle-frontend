"use client";

import {
  User,
  Shield,
  Lock,
  Bell,
  Palette,
  Wallet,
  Download,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsCategory =
  | "general"
  | "security"
  | "privacy"
  | "notifications"
  | "appearance"
  | "payments"
  | "data";

interface CategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const SETTINGS_CATEGORIES: CategoryItem[] = [
  { id: "general", label: "General", icon: User, description: "Nombre, usuario, contacto" },
  { id: "security", label: "Seguridad e inicio de sesión", icon: Shield, description: "Contraseña, 2FA, sesiones" },
  { id: "privacy", label: "Privacidad", icon: Lock, description: "Quién puede ver tu información" },
  { id: "notifications", label: "Notificaciones", icon: Bell, description: "Email, push, en la app" },
  { id: "appearance", label: "Apariencia", icon: Palette, description: "Tema, idioma, zona horaria" },
  { id: "payments", label: "Pagos y billetera", icon: Wallet, description: "Métodos de retiro, IBAN" },
  { id: "data", label: "Tu información", icon: Download, description: "Exportar, eliminar cuenta" },
];

interface SettingsSidebarProps {
  active: SettingsCategory;
  onChange: (category: SettingsCategory) => void;
  className?: string;
}

export function SettingsSidebar({ active, onChange, className }: SettingsSidebarProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {SETTINGS_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
              isActive
                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
              isActive
                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
            )}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold truncate",
                isActive ? "text-indigo-700 dark:text-indigo-300" : "",
              )}>
                {cat.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden lg:block">
                {cat.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

/** Mobile category list — shown as full page on small screens */
interface MobileCategoryListProps {
  onSelect: (category: SettingsCategory) => void;
}

export function MobileCategoryList({ onSelect }: MobileCategoryListProps) {
  return (
    <div className="space-y-1">
      {SETTINGS_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-400">
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {cat.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cat.description}
              </p>
            </div>
            <ChevronLeft size={16} className="text-slate-400 rotate-180 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

/** Mobile back header */
interface MobileBackHeaderProps {
  label: string;
  onBack: () => void;
}

export function MobileBackHeader({ label, onBack }: MobileBackHeaderProps) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
    >
      <ChevronLeft size={20} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

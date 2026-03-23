"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const menuRef = useRef<HTMLDivElement>(null);

  // Detectar tema actual
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Avatar
          src={user.profile_picture_url}
          alt={user.full_name ?? user.username}
          size="sm"
          fallbackName={user.full_name ?? user.username}
        />
        <ChevronDown
          size={14}
          className={cn(
            "text-slate-500 hidden lg:block transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-down">
          {/* Header con info del usuario */}
          <div className="p-4 border-b border-slate-200 dark:border-gray-700">
            <Link
              href={`/profile/${user.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
            >
              <Avatar
                src={user.profile_picture_url}
                alt={user.full_name ?? user.username}
                size="lg"
                fallbackName={user.full_name ?? user.username}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                  {user.full_name ?? user.username}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  Ver tu perfil
                </p>
              </div>
            </Link>
          </div>

          {/* Opciones del menú */}
          <div className="py-2">
            <Link
              href={`/profile/${user.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                <UserCircle size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Mi perfil
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ver tu perfil público
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                <Settings size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  Configuración
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ajustes y privacidad
                </p>
              </div>
            </Link>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                {theme === "light" ? (
                  <Moon size={20} className="text-slate-600 dark:text-slate-300" />
                ) : (
                  <Sun size={20} className="text-slate-600 dark:text-slate-300" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {theme === "light" ? "Modo oscuro" : "Modo claro"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cambiar apariencia
                </p>
              </div>
            </button>
          </div>

          {/* Cerrar sesión */}
          <div className="border-t border-slate-200 dark:border-gray-700 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Cerrar sesión
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Salir de tu cuenta
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

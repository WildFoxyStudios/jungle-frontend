"use client";

import { Home, Radio, Film, Tv, Bookmark, Users, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type WatchSection = 'home' | 'live' | 'reels' | 'shows' | 'saved' | 'following';

interface SidebarItem {
  id: WatchSection;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const SIDEBAR_SECTIONS: SidebarItem[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'live', label: 'En vivo', icon: Radio, badge: 'Pronto' },
  { id: 'reels', label: 'Reels', icon: Film, badge: 'Pronto' },
  { id: 'shows', label: 'Shows', icon: Tv, badge: 'Pronto' },
  { id: 'saved', label: 'Guardados', icon: Bookmark },
  { id: 'following', label: 'Siguiendo', icon: Users },
] as const;

export interface WatchSidebarProps {
  activeSection: WatchSection;
  onSectionChange: (section: WatchSection) => void;
  collapsed?: boolean;
}

/**
 * Left sidebar navigation for Watch sections.
 * - Desktop (>1024px): 240px with icons + labels
 * - Tablet (768-1024px): 60px with icons only
 * - Mobile (<768px): hidden (replaced by horizontal nav in WatchPage)
 */
export function WatchSidebar({ activeSection, onSectionChange, collapsed }: WatchSidebarProps) {
  return (
    <aside className="hidden md:flex md:w-[60px] lg:w-[240px] flex-col shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900">
      {/* Header - visible only on desktop */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Play size={16} className="text-red-600 dark:text-red-400 ml-0.5" fill="currentColor" />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-slate-50">Watch</span>
      </div>

      <nav className="flex flex-col gap-1 px-2 py-3">
        {SIDEBAR_SECTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl transition-all text-left relative",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5 lg:px-3 md:justify-center lg:justify-start",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800",
              )}
              title={item.label}
            >
              <Icon size={20} className="shrink-0" />
              <span className="hidden lg:inline text-sm font-medium truncate">
                {item.label}
              </span>
              {/* Badge for upcoming features */}
              {item.badge && (
                <span className="hidden lg:inline ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export { SIDEBAR_SECTIONS };

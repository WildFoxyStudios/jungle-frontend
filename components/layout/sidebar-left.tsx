"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, MessageCircle, Bell, Bookmark, Calendar, Briefcase,
  HeartHandshake, ShoppingCart, Tv, Video,
  Clock, Globe, Flag, Radio
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/home",          icon: Home,           label: "Inicio" },
  { href: "/friends",       icon: Users,          label: "Amigos" },
  { href: "/messages",      icon: MessageCircle,  label: "Mensajes" },
  { href: "/notifications", icon: Bell,           label: "Notificaciones" },
  { href: "/memories",      icon: Clock,          label: "Recuerdos" },
  { href: "/saved",         icon: Bookmark,       label: "Guardado" },
  { href: "/groups",        icon: Globe,          label: "Grupos" },
  { href: "/events",        icon: Calendar,       label: "Eventos" },
  { href: "/reels",         icon: Video,          label: "Reels" },
  { href: "/watch",         icon: Tv,             label: "Watch" },
  { href: "/marketplace",   icon: ShoppingCart,   label: "Marketplace" },
  { href: "/jobs",          icon: Briefcase,      label: "Empleos" },
  { href: "/fundraisers",   icon: HeartHandshake, label: "Recaudaciones" },
  { href: "/pages",         icon: Flag,           label: "Páginas" },
  { href: "/live",          icon: Radio,          label: "En Vivo" },
];


interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  collapsed?: boolean;
}

function SidebarItem({ href, icon: Icon, label, badge, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
        collapsed ? "justify-center" : "",
        active
          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-slate-100",
      )}
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-tight",
            collapsed && "absolute top-1 right-1 ml-0",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarLeft({ collapsed }: { collapsed?: boolean }) {
  const { unreadCount } = useRealtime();

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 bottom-0 z-30 flex flex-col",
        "bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700",
        "transition-all duration-200 overflow-hidden",
        collapsed ? "w-16" : "w-[260px]",
      )}
    >
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {mainLinks.map(({ href, icon, label }) => (
          <SidebarItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            badge={href === "/notifications" ? unreadCount : undefined}
            collapsed={collapsed}
          />
        ))}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Video, ShoppingBag, Bell } from "lucide-react";
import { useRealtime } from "@/contexts/RealtimeContext";
import { NotifBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home",          icon: Home,        label: "Inicio" },
  { href: "/friends",       icon: Users,       label: "Amigos" },
  { href: "/reels",         icon: Video,       label: "Reels" },
  { href: "/marketplace",   icon: ShoppingBag, label: "Tienda" },
  { href: "/notifications", icon: Bell,        label: "Alertas", badge: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useRealtime();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 pb-safe">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const count = badge ? unreadCount : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 relative",
                "transition-colors",
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500",
              )}
              aria-label={label}
            >
              <span className="relative">
                <Icon size={23} />
                {count > 0 && <NotifBadge count={count} />}
              </span>
              <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

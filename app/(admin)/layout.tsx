"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  LayoutDashboard, Users, ShieldAlert, FileText, UsersRound, BookOpen,
  Calendar, ShoppingBag, Briefcase, Film, Radio, Heart, Clock, Star,
  BarChart2, Activity, Lock, ScrollText, Bell, Settings, Menu, X, ChevronLeft,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, route: "/admin" },
  { label: "Usuarios", icon: Users, route: "/admin/users" },
  { label: "Moderación", icon: ShieldAlert, route: "/admin/moderation" },
  { label: "Posts", icon: FileText, route: "/admin/posts" },
  { label: "Grupos", icon: UsersRound, route: "/admin/groups" },
  { label: "Páginas", icon: BookOpen, route: "/admin/pages" },
  { label: "Eventos", icon: Calendar, route: "/admin/events" },
  { label: "Marketplace", icon: ShoppingBag, route: "/admin/marketplace" },
  { label: "Empleos", icon: Briefcase, route: "/admin/jobs" },
  { label: "Reels", icon: Film, route: "/admin/reels" },
  { label: "Streams", icon: Radio, route: "/admin/streams" },
  { label: "Recaudaciones", icon: Heart, route: "/admin/fundraisers" },
  { label: "Stories", icon: Clock, route: "/admin/stories" },
  { label: "Premium", icon: Star, route: "/admin/premium" },
  { label: "Analytics", icon: BarChart2, route: "/admin/analytics" },
  { label: "Sistema", icon: Activity, route: "/admin/system-health" },
  { label: "GDPR", icon: Lock, route: "/admin/gdpr" },
  { label: "Audit Log", icon: ScrollText, route: "/admin/audit-log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "admin" && user.role !== "moderator") {
      router.replace("/home");
    }
  }, [user, loading, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-white" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "moderator")) return null;

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "bg-gray-900 flex flex-col h-screen transition-all duration-200 shrink-0",
        "hidden md:flex md:w-60",
        sidebarOpen && "!flex fixed inset-y-0 left-0 z-50 w-60 shadow-2xl",
      )}>
        <div className="flex items-center h-12 px-3 border-b border-gray-800">
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <X size={18} />
            </button>
          )}
          <Link href="/admin" className="ml-2 text-white font-semibold text-sm truncate">Admin Panel</Link>
          <Link href="/home" className="ml-auto text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <ChevronLeft size={14} /> App
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(({ label, icon: Icon, route }) => {
            const isActive = pathname === route || (route !== "/admin" && pathname.startsWith(route + "/"));
            return (
              <Link key={route} href={route}
                className={cn("flex items-center gap-3 px-3 py-2 mx-2 my-0.5 rounded text-sm transition-colors",
                  isActive ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800")}>
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center gap-4 pl-14 md:pl-6">
          <h2 className="text-sm font-medium text-gray-400 truncate">
            {navItems.find(n => pathname === n.route || (n.route !== "/admin" && pathname.startsWith(n.route)))?.label ?? "Admin"}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

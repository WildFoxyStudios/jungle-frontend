"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  MessageCircle,
  Home,
  Users,
  Tv,
  Store,
  X,
  Loader2,
  Clock,
  TrendingUp,
  Hash,
  Globe,
  Bookmark,
  Trash2,
  Menu,
  Briefcase,
  Calendar,
  HeartHandshake,
  ShoppingCart,
  Video,
  Flag,
  Radio,
} from "lucide-react";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useAuth } from "@/contexts/AuthContext";
import { searchApi } from "@/lib/api-search";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "@/components/ui/avatar";
import { NotifBadge } from "@/components/ui/badge";
import { NotifDropdown } from "@/components/layout/notif-dropdown";
import type {
  AutocompleteResults,
  SearchHistoryEntry,
  TrendingSearch,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const navLinks = [
  { href: "/home", icon: Home, label: "Inicio" },
  { href: "/friends", icon: Users, label: "Amigos" },
  { href: "/watch", icon: Tv, label: "Watch" },
  { href: "/marketplace", icon: Store, label: "Marketplace" },
];

export function Navbar() {
  const { unreadCount } = useRealtime();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Autocomplete state
  const [autocomplete, setAutocomplete] = useState<AutocompleteResults | null>(null);
  const [acLoading, setAcLoading] = useState(false);

  // History & trending
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load history & trending when dropdown opens with empty query
  const loadHistoryAndTrending = useCallback(async () => {
    if (historyLoaded) return;
    try {
      const [h, t] = await Promise.all([
        searchApi.getHistory({ limit: 10 }),
        searchApi.getTrending({ limit: 5 }),
      ]);
      setHistory(h ?? []);
      setTrending(t ?? []);
      setHistoryLoaded(true);
    } catch {
      // silent
    }
  }, [historyLoaded]);

  // Fetch autocomplete on 2+ chars
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setAutocomplete(null);
      return;
    }
    setAcLoading(true);
    searchApi
      .autocomplete({ q: debouncedQuery, limit: 8 })
      .then((r) => setAutocomplete(r))
      .catch(() => setAutocomplete(null))
      .finally(() => setAcLoading(false));
  }, [debouncedQuery]);

  const handleFocus = () => {
    setDropdownOpen(true);
    if (!query.trim()) loadHistoryAndTrending();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setDropdownOpen(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await searchApi.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // silent
    }
  };

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await searchApi.clearHistory();
      setHistory([]);
    } catch {
      // silent
    }
  };

  const navigateAndClose = (href: string) => {
    router.push(href);
    setDropdownOpen(false);
    setQuery("");
  };

  const hasAutocomplete =
    autocomplete &&
    (autocomplete.users.length > 0 ||
      autocomplete.hashtags.length > 0 ||
      autocomplete.pages.length > 0 ||
      autocomplete.groups.length > 0);

  const showEmptyState = !query.trim();
  const showAutocomplete = query.trim().length >= 2;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 shadow-sm safe-top">
      <div className="flex items-center h-full px-2 sm:px-3 gap-1 sm:gap-2 max-w-screen-2xl mx-auto">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-slate-300 shrink-0"
          aria-label="Menú"
        >
          <Menu size={20} />
        </button>

        {/* Logo — hidden on mobile when hamburger is shown */}
        <Link href="/home" className="shrink-0 flex items-center gap-2 mr-1 sm:mr-2">
          <img src="/logo2.svg" alt="Logo" className="h-7 sm:h-11 w-auto" />
        </Link>

        {/* Search with autocomplete */}
        <div ref={searchRef} className="relative flex-1 max-w-[160px] sm:max-w-[280px]">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={handleFocus}
                className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-sm bg-slate-100 dark:bg-gray-800 border border-transparent rounded-full focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-400 transition-all placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setAutocomplete(null);
                  }}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="fixed sm:absolute top-14 sm:top-full left-0 sm:left-auto right-0 sm:right-auto sm:mt-1 w-full sm:w-[360px] bg-white dark:bg-gray-800 sm:rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-down max-h-[70vh] overflow-y-auto">
              {/* Empty state: history + trending */}
              {showEmptyState && (
                <>
                  {history.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <Clock size={12} /> Recientes
                        </span>
                        <button
                          onClick={handleClearHistory}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Borrar todo
                        </button>
                      </div>
                      {history.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => navigateAndClose(`/search?q=${encodeURIComponent(h.query)}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left group"
                        >
                          <Search size={14} className="text-slate-400 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
                            {h.query}
                          </span>
                          <button
                            onClick={(e) => handleDeleteHistoryItem(h.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-gray-600 transition-all text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </button>
                      ))}
                    </div>
                  ) : trending.length > 0 ? (
                    <div>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <TrendingUp size={12} /> Tendencias
                        </span>
                      </div>
                      {trending.slice(0, 5).map((t) => (
                        <button
                          key={t.query}
                          onClick={() => navigateAndClose(`/search?q=${encodeURIComponent(t.query)}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <TrendingUp size={14} className="text-indigo-500 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                            {t.query}
                          </span>
                          <span className="text-xs text-slate-400">{t.daily_count}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* Show trending below history if history exists */}
                  {history.length > 0 && trending.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-gray-700">
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <TrendingUp size={12} /> Tendencias
                        </span>
                      </div>
                      {trending.slice(0, 3).map((t) => (
                        <button
                          key={t.query}
                          onClick={() => navigateAndClose(`/search?q=${encodeURIComponent(t.query)}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <TrendingUp size={14} className="text-indigo-500 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                            {t.query}
                          </span>
                          <span className="text-xs text-slate-400">{t.daily_count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Autocomplete results */}
              {showAutocomplete && (
                <>
                  {acLoading && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      Buscando...
                    </div>
                  )}

                  {!acLoading && hasAutocomplete && (
                    <>
                      {/* People */}
                      {autocomplete!.users.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <Users size={12} /> Personas
                            </span>
                          </div>
                          {autocomplete!.users.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => navigateAndClose(`/profile/${u.id}`)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <Avatar
                                src={u.profile_picture}
                                alt={u.full_name ?? u.username}
                                size="sm"
                                fallbackName={u.full_name ?? u.username}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                  {u.full_name ?? u.username}
                                </p>
                                <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Hashtags */}
                      {autocomplete!.hashtags.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-gray-700">
                          <div className="px-4 pt-3 pb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <Hash size={12} /> Hashtags
                            </span>
                          </div>
                          {autocomplete!.hashtags.map((h) => (
                            <button
                              key={h.name}
                              onClick={() =>
                                navigateAndClose(`/search?q=${encodeURIComponent("#" + h.name)}`)
                              }
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                <Hash size={14} className="text-indigo-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                  #{h.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {h.usage_count.toLocaleString()} publicaciones
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Pages */}
                      {autocomplete!.pages.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-gray-700">
                          <div className="px-4 pt-3 pb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <Bookmark size={12} /> Páginas
                            </span>
                          </div>
                          {autocomplete!.pages.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => navigateAndClose(`/pages/${p.id}`)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                <Bookmark size={14} className="text-emerald-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                  {p.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{p.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Groups */}
                      {autocomplete!.groups.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-gray-700">
                          <div className="px-4 pt-3 pb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <Globe size={12} /> Grupos
                            </span>
                          </div>
                          {autocomplete!.groups.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => navigateAndClose(`/groups/${g.id}`)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                <Globe size={14} className="text-purple-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                  {g.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {g.members_count.toLocaleString()} miembros
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {!acLoading && !hasAutocomplete && query.trim().length >= 2 && (
                    <p className="px-4 py-3 text-sm text-slate-500">
                      Sin sugerencias para &ldquo;{query}&rdquo;
                    </p>
                  )}

                  {/* See all results link */}
                  {query.trim() && (
                    <button
                      onClick={() => navigateAndClose(`/search?q=${encodeURIComponent(query.trim())}`)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-slate-50 dark:hover:bg-gray-700 border-t border-slate-100 dark:border-gray-700"
                    >
                      <Search size={14} />
                      Ver todos los resultados de &ldquo;{query}&rdquo;
                    </button>
                  )}
                </>
              )}

              {/* Typing 1 char — show prompt */}
              {query.trim().length === 1 && (
                <p className="px-4 py-3 text-sm text-slate-500">
                  Escribe al menos 2 caracteres para buscar
                </p>
              )}
            </div>
          )}
        </div>

        {/* Center nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <NavLink key={href} href={href} icon={<Icon size={22} />} label={label} />
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 ml-auto shrink-0">
          <Link
            href="/messages"
            className="relative p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-slate-300"
          >
            <MessageCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
            {msgCount > 0 && <NotifBadge count={msgCount} />}
          </Link>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
              {unreadCount > 0 && <NotifBadge count={unreadCount} />}
            </button>
            {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          <UserMenu />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <MobileSidebarDrawer onClose={() => setMobileMenuOpen(false)} />
        </>
      )}
    </header>
  );
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "flex items-center justify-center px-5 py-2 rounded-lg transition-colors min-w-[80px]",
        "border-b-2",
        isActive
          ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 border-transparent",
      )}
    >
      {icon}
    </Link>
  );
}

// ─── Mobile Sidebar Drawer ────────────────────────────────────────────────────

const mobileMenuLinks = [
  { href: "/home", icon: Home, label: "Inicio" },
  { href: "/friends", icon: Users, label: "Amigos" },
  { href: "/messages", icon: MessageCircle, label: "Mensajes" },
  { href: "/notifications", icon: Bell, label: "Notificaciones" },
  { href: "/saved", icon: Bookmark, label: "Guardado" },
  { href: "/groups", icon: Globe, label: "Grupos" },
  { href: "/events", icon: Calendar, label: "Eventos" },
  { href: "/reels", icon: Video, label: "Reels" },
  { href: "/watch", icon: Tv, label: "Watch" },
  { href: "/marketplace", icon: ShoppingCart, label: "Marketplace" },
  { href: "/jobs", icon: Briefcase, label: "Empleos" },
  { href: "/fundraisers", icon: HeartHandshake, label: "Recaudaciones" },
  { href: "/pages", icon: Flag, label: "Páginas" },
  { href: "/live", icon: Radio, label: "En Vivo" },
];

function MobileSidebarDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-gray-700">
        <Link href={user ? `/profile/${user.id}` : "/home"} onClick={onClose} className="flex items-center gap-3">
          <Avatar src={user?.profile_picture_url} alt={user?.full_name ?? user?.username ?? ""} size="sm" fallbackName={user?.full_name ?? user?.username ?? ""} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{user?.full_name ?? user?.username}</p>
            <p className="text-xs text-slate-500 truncate">Ver tu perfil</p>
          </div>
        </Link>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500">
          <X size={20} />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {mobileMenuLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                active
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800",
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-700">
        <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
          <Store size={20} className="shrink-0" />
          <span className="text-sm font-medium">Configuración</span>
        </Link>
      </div>
    </div>
  );
}

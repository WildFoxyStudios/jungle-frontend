"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  MessageCircle,
  Home,
  Users,
  Tv,
  Store,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { searchApi } from "@/lib/api-search";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "@/components/ui/avatar";
import { NotifBadge } from "@/components/ui/badge";
import { NotifDropdown } from "@/components/layout/notif-dropdown";
import type { SearchResults } from "@/lib/types";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/home", icon: Home, label: "Inicio" },
  { href: "/friends", icon: Users, label: "Amigos" },
  { href: "/watch", icon: Tv, label: "Watch" },
  { href: "/marketplace", icon: Store, label: "Marketplace" },
];

export function Navbar() {
  const { user } = useAuth();
  const { unreadCount } = useRealtime();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgCount] = useState(0);

  const debouncedQuery = useDebounce(query, 350);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch search results — no synchronous setState in effect body
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    setSearching(true);
    searchApi
      .search({ q: debouncedQuery, limit: 5 })
      .then((r) => setResults(r))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center h-full px-3 gap-2 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/home" className="shrink-0 flex items-center gap-2 mr-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-black text-lg leading-none">
              S
            </span>
          </div>
          <span className="hidden lg:block font-bold text-indigo-600 text-lg">
            Social
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-[280px]">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Buscar en Social..."
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  setSearchOpen(true);
                  if (!val.trim()) setResults(null);
                }}
                onFocus={() => setSearchOpen(true)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-gray-800 border border-transparent rounded-full focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-400 transition-all placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    setSearching(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Search dropdown */}
          {searchOpen && (query.trim() || results) && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-down">
              {searching && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Buscando...
                </div>
              )}
              {results && !searching && (
                <>
                  {results.users.slice(0, 3).map((u) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Avatar
                        src={u.profile_picture}
                        alt={u.full_name}
                        size="sm"
                        fallbackName={u.full_name}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {u.full_name}
                        </p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </Link>
                  ))}

                  {results.total > 0 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 font-medium hover:bg-slate-50 dark:hover:bg-gray-700 border-t border-slate-100 dark:border-gray-700"
                    >
                      <Search size={14} />
                      Ver todos los resultados de &ldquo;{query}&rdquo;
                    </Link>
                  )}

                  {results.total === 0 && !searching && (
                    <p className="px-4 py-3 text-sm text-slate-500">
                      Sin resultados para &ldquo;{query}&rdquo;
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Center nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <NavLink
              key={href}
              href={href}
              icon={<Icon size={22} />}
              label={label}
            />
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Link
            href="/messages"
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-slate-300"
          >
            <MessageCircle size={22} />
            {msgCount > 0 && <NotifBadge count={msgCount} />}
          </Link>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <Bell size={22} />
              {unreadCount > 0 && <NotifBadge count={unreadCount} />}
            </button>
            {notifOpen && <NotifDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          {user && (
            <Link
              href={`/profile/${user.id}`}
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
                className="text-slate-500 hidden lg:block"
              />
            </Link>
          )}
        </div>
      </div>
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
  const isActive =
    typeof window !== "undefined" && window.location.pathname.startsWith(href);

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

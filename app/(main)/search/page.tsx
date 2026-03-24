"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  FileText,
  Globe,
  ShoppingBag,
  Calendar,
  Bookmark,
  TrendingUp,
  Clock,
  X,
  SlidersHorizontal,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { searchApi } from "@/lib/api-search";
import { friendsApi } from "@/lib/api-friends";
import { useApi, useMutation } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type {
  SearchResults,
  SearchUser,
  SearchPost,
  SearchGroup,
  SearchPage,
  SearchProduct,
  SearchEvent,
  TrendingSearch,
} from "@/lib/types";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { value: "all", label: "Todo", icon: Search },
  { value: "posts", label: "Posts", icon: FileText },
  { value: "people", label: "Personas", icon: Users },
  { value: "groups", label: "Grupos", icon: Globe },
  { value: "pages", label: "Páginas", icon: Bookmark },
  { value: "products", label: "Productos", icon: ShoppingBag },
  { value: "events", label: "Eventos", icon: Calendar },
] as const;

type SearchTab = (typeof TABS)[number]["value"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  // ── Trending & history ────────────────────────────────────────────────────
  const { data: trending } = useApi(
    () => searchApi.getTrending({ limit: 8 }),
    [],
  );
  const { data: history, refresh: refreshHistory } = useApi(
    () => searchApi.getHistory({ limit: 10 }),
    [],
  );

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      queueMicrotask(() => setResults(null));
      return;
    }

    queueMicrotask(() => setSearching(true));
    const searchType = activeTab === "all" ? undefined : activeTab;

    searchApi
      .search({ q: debouncedQuery, search_type: searchType as any, limit: 20 })
      .then((r) => {
        setResults(r);
        // Update URL
        const params = new URLSearchParams({ q: debouncedQuery });
        router.replace(`/search?${params.toString()}`, { scroll: false });
        // Track
        searchApi
          .track({ query: debouncedQuery, search_type: searchType })
          .catch(() => {});
      })
      .catch(() => toast.error("Error al buscar"))
      .finally(() => setSearching(false));
  }, [debouncedQuery, activeTab]);

  const handleClearHistory = async () => {
    await searchApi.clearHistory();
    refreshHistory();
    toast.success("Historial borrado");
  };

  const total = results
    ? results.posts.length +
      results.users.length +
      results.groups.length +
      results.pages.length +
      results.products.length +
      results.events.length
    : 0;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[860px] mx-auto px-4 py-6 pb-24">
      {/* ── Search input ──────────────────────────────────────────────────── */}
      <div className="relative mb-6">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Buscar personas, grupos, páginas, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-12 py-3.5 text-base bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── No query: trending + history ──────────────────────────────────── */}
      {!query.trim() && (
        <div className="space-y-6 animate-fade-in">
          {/* Trending */}
          {trending && trending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-indigo-500" />
                <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  Tendencias
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t.query}
                    onClick={() => setQuery(t.query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <TrendingUp size={12} className="opacity-60" />
                    {t.query}
                    <span className="text-xs text-slate-400 ml-1">
                      {t.daily_count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search history */}
          {history && history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    Búsquedas recientes
                  </h2>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Borrar todo
                </button>
              </div>
              <div className="surface divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(h.query)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <Search size={15} className="text-slate-400 shrink-0" />
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                      {h.query}
                    </span>
                    {h.search_type && h.search_type !== "all" && (
                      <Badge variant="default" size="sm">
                        {h.search_type}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick categories */}
          <div>
            <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-3">
              Explorar por categoría
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TABS.filter((t) => t.value !== "all").map(
                ({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setActiveTab(value);
                    }}
                    className="surface p-4 flex items-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                      <Icon
                        size={20}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                      {label}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {query.trim() && (
        <div className="animate-fade-in">
          {/* Result count */}
          {!searching && results && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {total === 0
                ? `Sin resultados para "${query}"`
                : `${total} resultado${total !== 1 ? "s" : ""} para `}
              {total > 0 && (
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  "{query}"
                </span>
              )}
            </p>
          )}

          {/* Tabs */}
          <Tabs
            defaultTab="all"
            onChange={(tab) => setActiveTab(tab as SearchTab)}
          >
            <div className="surface mb-4 overflow-x-auto no-scrollbar">
              <TabList className="px-2 min-w-max">
                {TABS.map(({ value, label, icon: Icon }) => {
                  const count = results
                    ? value === "all"
                      ? total
                      : value === "people"
                        ? results.users.length
                        : value === "posts"
                          ? results.posts.length
                          : value === "groups"
                            ? results.groups.length
                            : value === "pages"
                              ? results.pages.length
                              : value === "products"
                                ? results.products.length
                                : value === "events"
                                  ? results.events.length
                                  : 0
                    : 0;

                  return (
                    <Tab key={value} value={value}>
                      <span className="flex items-center gap-1.5">
                        <Icon size={14} />
                        {label}
                        {count > 0 && (
                          <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">
                            {count}
                          </span>
                        )}
                      </span>
                    </Tab>
                  );
                })}
              </TabList>
            </div>

            {/* Loading */}
            {searching && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="surface p-4 flex items-center gap-3">
                    <Skeleton className="w-12 h-12 shrink-0" rounded />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-2.5 w-64" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results panels */}
            {!searching && results && (
              <>
                {/* All */}
                <TabPanel value="all">
                  {total === 0 ? (
                    <NoResults query={query} />
                  ) : (
                    <div className="space-y-6">
                      {results.users.length > 0 && (
                        <Section
                          title="Personas"
                          icon={<Users size={16} />}
                          seeAll={() => setActiveTab("people")}
                        >
                          <div className="space-y-2">
                            {results.users.slice(0, 3).map((u) => (
                              <PeopleResult key={u.id} user={u} />
                            ))}
                          </div>
                        </Section>
                      )}

                      {results.posts.length > 0 && (
                        <Section
                          title="Publicaciones"
                          icon={<FileText size={16} />}
                          seeAll={() => setActiveTab("posts")}
                        >
                          <div className="space-y-2">
                            {results.posts.slice(0, 3).map((p) => (
                              <PostResult key={p.id} post={p} />
                            ))}
                          </div>
                        </Section>
                      )}

                      {results.groups.length > 0 && (
                        <Section
                          title="Grupos"
                          icon={<Globe size={16} />}
                          seeAll={() => setActiveTab("groups")}
                        >
                          <div className="space-y-2">
                            {results.groups.slice(0, 3).map((g) => (
                              <GroupResult key={g.id} group={g} />
                            ))}
                          </div>
                        </Section>
                      )}

                      {results.pages.length > 0 && (
                        <Section
                          title="Páginas"
                          icon={<Bookmark size={16} />}
                          seeAll={() => setActiveTab("pages")}
                        >
                          <div className="space-y-2">
                            {results.pages.slice(0, 3).map((p) => (
                              <PageResult key={p.id} page={p} />
                            ))}
                          </div>
                        </Section>
                      )}

                      {results.products.length > 0 && (
                        <Section
                          title="Productos"
                          icon={<ShoppingBag size={16} />}
                          seeAll={() => setActiveTab("products")}
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {results.products.slice(0, 3).map((p) => (
                              <ProductResult key={p.id} product={p} />
                            ))}
                          </div>
                        </Section>
                      )}

                      {results.events.length > 0 && (
                        <Section
                          title="Eventos"
                          icon={<Calendar size={16} />}
                          seeAll={() => setActiveTab("events")}
                        >
                          <div className="space-y-2">
                            {results.events.slice(0, 3).map((e) => (
                              <EventResult key={e.id} event={e} />
                            ))}
                          </div>
                        </Section>
                      )}
                    </div>
                  )}
                </TabPanel>

                {/* People */}
                <TabPanel value="people">
                  {results.users.length === 0 ? (
                    <NoResults query={query} type="personas" />
                  ) : (
                    <div className="surface divide-y divide-slate-100 dark:divide-slate-800">
                      {results.users.map((u) => (
                        <PeopleResult key={u.id} user={u} expanded />
                      ))}
                    </div>
                  )}
                </TabPanel>

                {/* Posts */}
                <TabPanel value="posts">
                  {results.posts.length === 0 ? (
                    <NoResults query={query} type="publicaciones" />
                  ) : (
                    <div className="surface divide-y divide-slate-100 dark:divide-slate-800">
                      {results.posts.map((p) => (
                        <PostResult key={p.id} post={p} expanded />
                      ))}
                    </div>
                  )}
                </TabPanel>

                {/* Groups */}
                <TabPanel value="groups">
                  {results.groups.length === 0 ? (
                    <NoResults query={query} type="grupos" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.groups.map((g) => (
                        <GroupResult key={g.id} group={g} card />
                      ))}
                    </div>
                  )}
                </TabPanel>

                {/* Pages */}
                <TabPanel value="pages">
                  {results.pages.length === 0 ? (
                    <NoResults query={query} type="páginas" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.pages.map((p) => (
                        <PageResult key={p.id} page={p} card />
                      ))}
                    </div>
                  )}
                </TabPanel>

                {/* Products */}
                <TabPanel value="products">
                  {results.products.length === 0 ? (
                    <NoResults query={query} type="productos" />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {results.products.map((p) => (
                        <ProductResult key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </TabPanel>

                {/* Events */}
                <TabPanel value="events">
                  {results.events.length === 0 ? (
                    <NoResults query={query} type="eventos" />
                  ) : (
                    <div className="space-y-3">
                      {results.events.map((e) => (
                        <EventResult key={e.id} event={e} card />
                      ))}
                    </div>
                  )}
                </TabPanel>
              </>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  seeAll,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  seeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="text-indigo-500">{icon}</span>
          {title}
        </h2>
        {seeAll && (
          <button
            onClick={seeAll}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Ver todos
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── People result ────────────────────────────────────────────────────────────

function PeopleResult({
  user,
  expanded,
}: {
  user: SearchUser;
  expanded?: boolean;
}) {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const { execute: sendReq } = useMutation(() =>
    friendsApi.sendRequest(user.id),
  );

  const handleAdd = async () => {
    await sendReq();
    setSent(true);
    toast.success(`Solicitud enviada a ${user.full_name}`);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors",
        expanded ? "px-4 py-3.5" : "rounded-xl",
      )}
    >
      <Link href={`/profile/${user.id}`} className="shrink-0">
        <Avatar
          src={user.profile_picture}
          alt={user.full_name}
          size="md"
          fallbackName={user.full_name}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${user.id}`}
          className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:underline block truncate"
        >
          {user.full_name}
        </Link>
        <p className="text-xs text-slate-500 truncate">
          @{user.username}
          {user.bio && ` · ${user.bio}`}
        </p>
      </div>
      {sent ? (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<UserCheck size={13} />}
          className="shrink-0"
        >
          Enviada
        </Button>
      ) : (
        <Button
          size="sm"
          leftIcon={<UserPlus size={13} />}
          onClick={handleAdd}
          className="shrink-0"
        >
          Agregar
        </Button>
      )}
    </div>
  );
}

// ─── Post result ──────────────────────────────────────────────────────────────

function PostResult({
  post,
  expanded,
}: {
  post: SearchPost;
  expanded?: boolean;
}) {
  return (
    <Link
      href={`/home?post=${post.id}`}
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors",
        expanded ? "px-4 py-3.5" : "rounded-xl",
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
        <FileText size={18} className="text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {post.user_name}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
          {post.content}
        </p>
      </div>
    </Link>
  );
}

// ─── Group result ─────────────────────────────────────────────────────────────

function GroupResult({ group, card }: { group: SearchGroup; card?: boolean }) {
  const toast = useToast();
  const [joined, setJoined] = useState(false);

  if (card) {
    return (
      <div className="surface p-4 flex flex-col gap-3 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0">
            <Globe size={24} className="text-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/groups/${group.id}`}
              className="font-semibold text-slate-900 dark:text-slate-50 hover:underline block truncate"
            >
              {group.name}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">
              {group.member_count.toLocaleString()} miembros · {group.privacy}
            </p>
            {group.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                {group.description}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={joined ? "secondary" : "primary"}
          className="w-full"
          onClick={() => {
            setJoined(true);
            toast.success(`Unido a "${group.name}"`);
          }}
        >
          {joined ? "Unido" : "Unirse"}
        </Button>
      </div>
    );
  }

  return (
    <Link
      href={`/groups/${group.id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0">
        <Globe size={18} className="text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
          {group.name}
        </p>
        <p className="text-xs text-slate-500">
          {group.member_count.toLocaleString()} miembros · {group.privacy}
        </p>
      </div>
    </Link>
  );
}

// ─── Page result ──────────────────────────────────────────────────────────────

function PageResult({ page, card }: { page: SearchPage; card?: boolean }) {
  const [followed, setFollowed] = useState(false);
  const toast = useToast();

  if (card) {
    return (
      <div className="surface p-4 flex flex-col gap-3 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <Bookmark size={24} className="text-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              href={`/pages/${page.id}`}
              className="font-semibold text-slate-900 dark:text-slate-50 hover:underline block truncate"
            >
              {page.name}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">
              {page.likes_count.toLocaleString()} seguidores · {page.category}
            </p>
            {page.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                {page.description}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={followed ? "secondary" : "primary"}
          className="w-full"
          onClick={() => {
            setFollowed(true);
            toast.success(`Sigues a "${page.name}"`);
          }}
        >
          {followed ? "Siguiendo" : "Seguir"}
        </Button>
      </div>
    );
  }

  return (
    <Link
      href={`/pages/${page.id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
        <Bookmark size={18} className="text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
          {page.name}
        </p>
        <p className="text-xs text-slate-500">
          {page.likes_count.toLocaleString()} seguidores · {page.category}
        </p>
      </div>
    </Link>
  );
}

// ─── Product result ───────────────────────────────────────────────────────────

function ProductResult({ product }: { product: SearchProduct }) {
  return (
    <Link
      href={`/marketplace/${product.id}`}
      className="surface overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up group"
    >
      <div className="aspect-square bg-slate-100 dark:bg-gray-800 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag
              size={28}
              className="text-slate-300 dark:text-slate-600"
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">
          {product.title}
        </p>
        <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
          ${product.price.toLocaleString()}
        </p>
        {product.rating && (
          <p className="text-xs text-amber-500 mt-0.5">
            {"★".repeat(Math.round(product.rating))} {product.rating.toFixed(1)}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Event result ─────────────────────────────────────────────────────────────

function EventResult({ event, card }: { event: SearchEvent; card?: boolean }) {
  const date = new Date(event.start_time);
  const monthStr = date
    .toLocaleDateString("es", { month: "short" })
    .toUpperCase();
  const dayStr = date.getDate().toString();

  if (card) {
    return (
      <Link
        href={`/events/${event.id}`}
        className="surface p-4 flex items-center gap-4 hover:shadow-md transition-shadow animate-fade-in-up"
      >
        <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-none">
            {monthStr}
          </span>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 leading-none">
            {dayStr}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 dark:text-slate-50 truncate">
            {event.name}
          </p>
          {event.location && (
            <p className="text-sm text-slate-500 truncate mt-0.5">
              📍 {event.location}
            </p>
          )}
          <Badge variant="primary" size="sm" className="mt-1">
            {event.event_type}
          </Badge>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex flex-col items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-indigo-500 leading-none uppercase">
          {monthStr}
        </span>
        <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 leading-none">
          {dayStr}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
          {event.name}
        </p>
        {event.location && (
          <p className="text-xs text-slate-500 truncate">{event.location}</p>
        )}
      </div>
    </Link>
  );
}

// ─── No results ───────────────────────────────────────────────────────────────

function NoResults({ query, type }: { query: string; type?: string }) {
  return (
    <EmptyState
      icon={<Search size={32} />}
      title={`Sin resultados ${type ? `de ${type}` : ""}`}
      description={`No encontramos ${type ?? "nada"} que coincida con "${query}". Intenta con otras palabras.`}
      className="py-16"
    />
  );
}

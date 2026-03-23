"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  Clock,
  Eye,
  ThumbsUp,
  Bookmark,
  BookmarkCheck,
  Share2,
  MoreHorizontal,
  Search,
  TrendingUp,
  History,
  Bell,
  ChevronRight,
  Video,
  Plus,
  X,
} from "lucide-react";
import { watchApi } from "@/lib/api-watch";
import { useApi, useMutation, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { WatchVideo } from "@/lib/types";

// ─── Category chips ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "Entretenimiento", label: "Entretenimiento" },
  { value: "Música", label: "Música" },
  { value: "Deportes", label: "Deportes" },
  { value: "Tecnología", label: "Tecnología" },
  { value: "Cocina", label: "Cocina" },
  { value: "Viajes", label: "Viajes" },
  { value: "Educación", label: "Educación" },
  { value: "Gaming", label: "Gaming" },
  { value: "Noticias", label: "Noticias" },
  { value: "Humor", label: "Humor" },
];

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M vistas`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K vistas`;
  return `${n} vistas`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WatchPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Play
              size={20}
              className="text-red-600 dark:text-red-400 ml-0.5"
              fill="currentColor"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Watch
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Descubre videos de tu comunidad
            </p>
          </div>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setUploadOpen(true)}
        >
          Subir video
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Buscar videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-10 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
              category === cat.value
                ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultTab="feed">
        <div className="surface mb-5">
          <TabList className="px-2">
            <Tab value="feed">
              <span className="flex items-center gap-1.5">
                <Video size={14} />
                Para ti
              </span>
            </Tab>
            <Tab value="trending">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} />
                Tendencias
              </span>
            </Tab>
            <Tab value="subscriptions">
              <span className="flex items-center gap-1.5">
                <Bell size={14} />
                Suscripciones
              </span>
            </Tab>
            <Tab value="history">
              <span className="flex items-center gap-1.5">
                <History size={14} />
                Historial
              </span>
            </Tab>
          </TabList>
        </div>

        <TabPanel value="feed">
          <FeedTab category={category} search={debouncedSearch} />
        </TabPanel>
        <TabPanel value="trending">
          <TrendingTab />
        </TabPanel>
        <TabPanel value="subscriptions">
          <SubscriptionsTab />
        </TabPanel>
        <TabPanel value="history">
          <HistoryTab />
        </TabPanel>
      </Tabs>

      {/* Upload modal */}
      <UploadVideoModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}

// ─── Feed tab ─────────────────────────────────────────────────────────────────

function FeedTab({ category, search }: { category: string; search: string }) {
  const {
    items: videos,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) =>
      watchApi.getFeed({ category: category || undefined, limit, offset }),
    [category],
    16,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const filtered = search
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(search.toLowerCase()) ||
          v.description?.toLowerCase().includes(search.toLowerCase()) ||
          v.category?.toLowerCase().includes(search.toLowerCase()),
      )
    : videos;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Video size={36} />}
        title="Sin videos"
        description={
          search
            ? `No encontramos videos para "${search}".`
            : "No hay videos disponibles por el momento."
        }
        className="py-20"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured video (first item) */}
      {filtered[0] && !search && <FeaturedVideoCard video={filtered[0]} />}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(search ? filtered : filtered.slice(1)).map((video, i) => (
          <VideoCard key={video.id} video={video} index={i} />
        ))}
      </div>

      {loadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && filtered.length > 1 && (
        <p className="text-center text-sm text-slate-400 py-4">
          Has visto todos los videos disponibles
        </p>
      )}
    </div>
  );
}

// ─── Trending tab ─────────────────────────────────────────────────────────────

function TrendingTab() {
  const { data: videos, loading } = useApi(
    () => watchApi.getTrending({ limit: 20 }),
    [],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <VideoListSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp size={32} />}
        title="Sin tendencias"
        description="No hay videos en tendencia por el momento."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Videos más vistos hoy
      </p>
      {videos.map((video, i) => (
        <VideoListItem key={video.id} video={video} rank={i + 1} />
      ))}
    </div>
  );
}

// ─── Subscriptions tab ────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const {
    items: videos,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) => watchApi.getSubscriptions({ limit, offset }),
    [],
    12,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={32} />}
        title="Sin videos de suscripciones"
        description="Suscríbete a creadores para ver sus nuevos videos aquí."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, i) => (
          <VideoCard key={video.id} video={video} index={i} />
        ))}
      </div>
      {loadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const {
    items: videos,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) => watchApi.getHistory({ limit, offset }),
    [],
    20,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <VideoListSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<History size={32} />}
        title="Sin historial"
        description="Los videos que veas aparecerán en tu historial."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((video, i) => (
        <VideoListItem key={`${video.id}-${i}`} video={video} showDate />
      ))}
      {loadingMore && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <VideoListSkeleton key={i} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

// ─── Featured video card ──────────────────────────────────────────────────────

function FeaturedVideoCard({ video }: { video: WatchVideo }) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const { execute: saveVideo } = useMutation(() =>
    watchApi.saveVideo(video.id),
  );
  const { execute: unsaveVideo } = useMutation(() =>
    watchApi.unsaveVideo(video.id),
  );

  const handleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) await unsaveVideo();
      else {
        await saveVideo();
        toast.success("Video guardado");
      }
    } catch {
      setSaved(wasSaved);
    }
  };

  return (
    <Link href={`/watch/${video.id}`} className="block group">
      <div className="surface overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900">
              <Play size={56} className="text-white/30" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl">
              <Play
                size={24}
                className="text-slate-900 ml-1"
                fill="currentColor"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 text-white text-xs font-bold rounded">
            {formatDuration(video.duration)}
          </div>

          {/* Trending badge */}
          {video.is_trending && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">
                <TrendingUp size={12} />
                Trending
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {video.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {formatViews(video.views_count)}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp size={14} />
                {video.likes_count.toLocaleString()}
              </span>
              {video.category && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-gray-800 rounded-full text-xs font-medium">
                  {video.category}
                </span>
              )}
            </div>
            {video.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                {video.description}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {formatDistanceToNow(new Date(video.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                saved
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                  : "hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400",
              )}
              title={saved ? "Quitar de guardados" : "Guardar"}
            >
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(
                  `${window.location.origin}/watch/${video.id}`,
                );
              }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 transition-colors"
              title="Compartir"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Video card (grid) ────────────────────────────────────────────────────────

function VideoCard({ video, index }: { video: WatchVideo; index: number }) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const { execute: saveVideo } = useMutation(() =>
    watchApi.saveVideo(video.id),
  );
  const { execute: unsaveVideo } = useMutation(() =>
    watchApi.unsaveVideo(video.id),
  );

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) await unsaveVideo();
      else {
        await saveVideo();
        toast.success("Video guardado");
      }
    } catch {
      setSaved(wasSaved);
    }
  };

  return (
    <div
      className={cn("group animate-fade-in-up", `stagger-${(index % 5) + 1}`)}
    >
      <Link href={`/watch/${video.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-200 dark:bg-gray-800 rounded-xl overflow-hidden mb-3">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-800">
              <Play size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[11px] font-bold rounded">
            {formatDuration(video.duration)}
          </div>

          {/* Play button on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
              <Play
                size={18}
                className="text-slate-900 ml-0.5"
                fill="currentColor"
              />
            </div>
          </div>

          {/* Save button on hover */}
          <button
            onClick={handleSave}
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow",
              saved
                ? "bg-yellow-500 text-white opacity-100"
                : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70",
            )}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>

          {/* Trending */}
          {video.is_trending && (
            <div className="absolute top-2 left-2">
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded">
                <TrendingUp size={10} />
                Trending
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-0.5">
              <Eye size={12} />
              {formatViews(video.views_count)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>
              {formatDistanceToNow(new Date(video.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
          {video.category && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 rounded-full text-[11px] font-medium">
              {video.category}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

// ─── Video list item (trending / history) ─────────────────────────────────────

function VideoListItem({
  video,
  rank,
  showDate,
}: {
  video: WatchVideo;
  rank?: number;
  showDate?: boolean;
}) {
  const toast = useToast();

  return (
    <Link
      href={`/watch/${video.id}`}
      className="flex gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-gray-800/60 transition-colors group"
    >
      {/* Rank */}
      {rank !== undefined && (
        <div className="w-8 shrink-0 flex items-center justify-center">
          <span
            className={cn(
              "text-2xl font-black",
              rank <= 3
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-300 dark:text-slate-600",
            )}
          >
            {rank}
          </span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-800 shrink-0">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={20} className="text-slate-400" />
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
          {formatDuration(video.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {video.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-0.5">
            <Eye size={11} />
            {formatViews(video.views_count)}
          </span>
          <span className="flex items-center gap-0.5">
            <ThumbsUp size={11} />
            {video.likes_count.toLocaleString()}
          </span>
          {video.category && (
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-gray-800 rounded-full">
              {video.category}
            </span>
          )}
        </div>
        {showDate && (
          <p className="text-xs text-slate-400 mt-1">
            {formatDistanceToNow(new Date(video.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        )}
        {video.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">
            {video.description}
          </p>
        )}
      </div>

      {/* More */}
      <button
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard.writeText(
            `${window.location.origin}/watch/${video.id}`,
          );
          toast.success("Enlace copiado");
        }}
        className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 shrink-0 self-start"
        title="Copiar enlace"
      >
        <Share2 size={16} />
      </button>
    </Link>
  );
}

// ─── Upload video modal ───────────────────────────────────────────────────────

function UploadVideoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    is_public: true,
    allow_comments: true,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!form.title.trim() || !videoFile) return;
    setSaving(true);
    try {
      // In production: upload video via uploadApi first, then use the URL
      await watchApi.createVideo({
        title: form.title.trim(),
        description: form.description || undefined,
        video_url: videoPreview ?? "", // placeholder - use real upload URL
        duration: 0,
        category: form.category || undefined,
        is_public: form.is_public,
        allow_comments: form.allow_comments,
      });
      toast.success("Video publicado exitosamente");
      onClose();
    } catch {
      toast.error("Error al publicar el video");
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.title.trim() && videoFile;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subir video"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            loading={saving}
            disabled={!isValid}
            leftIcon={<Video size={15} />}
          >
            Publicar video
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Video upload zone */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Video <span className="text-red-500">*</span>
          </label>
          {videoPreview ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                controls
              />
              <button
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="upload-zone block aspect-video flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => handleVideoSelect(e.target.files?.[0] ?? null)}
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                <Video size={28} className="text-indigo-500" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Arrastra tu video aquí
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                MP4, WebM o MOV · Máximo 100 MB
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                Seleccionar archivo
              </Button>
            </label>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Dale un título descriptivo a tu video"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-slate-400 text-right">
            {form.title.length}/200
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            placeholder="Cuéntale a los espectadores de qué trata tu video..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={5000}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="input-base cursor-pointer"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.filter((c) => c.value !== "").map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Video público
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Cualquiera puede ver y buscar este video
              </p>
            </div>
            <button
              role="switch"
              aria-checked={form.is_public}
              onClick={() => set("is_public", !form.is_public)}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors",
                form.is_public
                  ? "bg-indigo-600"
                  : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <span
                className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
                style={{
                  transform: form.is_public
                    ? "translateX(20px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Permitir comentarios
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Los espectadores podrán comentar en tu video
              </p>
            </div>
            <button
              role="switch"
              aria-checked={form.allow_comments}
              onClick={() => set("allow_comments", !form.allow_comments)}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors",
                form.allow_comments
                  ? "bg-indigo-600"
                  : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <span
                className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
                style={{
                  transform: form.allow_comments
                    ? "translateX(20px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function VideoCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

function VideoListSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <Skeleton className="w-36 aspect-video rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

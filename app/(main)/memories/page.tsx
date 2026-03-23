"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Share2,
  Eye,
  EyeOff,
  Settings,
  ChevronRight,
  RefreshCw,
  Heart,
  Camera,
  Calendar,
  Smile,
} from "lucide-react";
import { memoriesApi } from "@/lib/api-memories";
import { useApi, useMutation, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { MemoryWithPost, MemoryPreferences } from "@/lib/types";

export default function MemoriesPage() {
  const toast = useToast();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [shareMemory, setShareMemory] = useState<MemoryWithPost | null>(null);
  const [shareComment, setShareComment] = useState("");
  const [sharing, setSharing] = useState(false);

  const {
    data: todayMemories,
    loading: loadingToday,
    refresh: refreshToday,
  } = useApi(() => memoriesApi.getToday(), []);

  const {
    items: allMemories,
    loading: loadingAll,
    loadingMore,
    hasMore,
    loadMore,
    refresh: refreshAll,
  } = useInfiniteApi(
    (offset, limit) => memoriesApi.getAll({ limit, offset }),
    [],
    12,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const { execute: markViewed } = useMutation((id: string) =>
    memoriesApi.markViewed(id),
  );

  const handleMarkViewed = async (memory: MemoryWithPost) => {
    if (!memory.is_viewed) {
      await markViewed(memory.id);
      refreshToday();
      refreshAll();
    }
  };

  const handleShare = async () => {
    if (!shareMemory) return;
    setSharing(true);
    try {
      await memoriesApi.share(shareMemory.id, {
        comment: shareComment || undefined,
      });
      toast.success("Recuerdo compartido como publicación");
      setShareMemory(null);
      setShareComment("");
    } catch {
      toast.error("Error al compartir el recuerdo");
    } finally {
      setSharing(false);
    }
  };

  const unviewedToday = (todayMemories ?? []).filter(
    (m) => !m.is_viewed,
  ).length;

  return (
    <div className="max-w-[760px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <Clock size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Recuerdos
            </h1>
            {unviewedToday > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                {unviewedToday} nuevo{unviewedToday > 1 ? "s" : ""} hoy
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Settings size={15} />}
          onClick={() => setPrefsOpen(true)}
        >
          Preferencias
        </Button>
      </div>

      <Tabs defaultTab="today">
        <div className="surface mb-5">
          <TabList className="px-2">
            <Tab value="today">
              Hoy
              {unviewedToday > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {unviewedToday}
                </span>
              )}
            </Tab>
            <Tab value="all">Todos los recuerdos</Tab>
          </TabList>
        </div>

        {/* Today */}
        <TabPanel value="today">
          {loadingToday && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <MemoryCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loadingToday && (!todayMemories || todayMemories.length === 0) && (
            <EmptyState
              icon={<Clock size={36} />}
              title="Sin recuerdos para hoy"
              description="Cuando publiques contenido, aparecerá como recuerdo en el futuro. ¡Sigue compartiendo momentos especiales!"
              action={
                <Link href="/home">
                  <Button
                    variant="secondary"
                    leftIcon={<RefreshCw size={15} />}
                  >
                    Ir al inicio
                  </Button>
                </Link>
              }
              className="py-16"
            />
          )}

          {!loadingToday && todayMemories && todayMemories.length > 0 && (
            <div className="space-y-5">
              {/* Banner */}
              <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 p-5 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <Smile size={24} />
                  <h2 className="text-xl font-black">Recuerdos de hoy</h2>
                </div>
                <p className="text-white/80 text-sm">
                  Mira lo que pasaba en tu vida hace{" "}
                  {todayMemories[0]?.years_ago}{" "}
                  {todayMemories[0]?.years_ago === 1 ? "año" : "años"}
                </p>
              </div>

              {todayMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onView={() => handleMarkViewed(memory)}
                  onShare={() => {
                    setShareMemory(memory);
                    handleMarkViewed(memory);
                  }}
                />
              ))}
            </div>
          )}
        </TabPanel>

        {/* All */}
        <TabPanel value="all">
          {loadingAll && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MemoryCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loadingAll && allMemories.length === 0 && (
            <EmptyState
              icon={<Camera size={32} />}
              title="Sin recuerdos aún"
              description="Tus publicaciones pasadas aparecerán aquí como recuerdos con el tiempo."
              className="py-16"
            />
          )}

          {!loadingAll && allMemories.length > 0 && (
            <div className="space-y-4">
              {/* Group by year */}
              {groupMemoriesByYear(allMemories).map(({ year, memories }) => (
                <div key={year}>
                  <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar size={14} />
                    Hace {year} {year === 1 ? "año" : "años"}
                  </h2>
                  <div className="space-y-3">
                    {memories.map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        onView={() => handleMarkViewed(memory)}
                        onShare={() => setShareMemory(memory)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadingMore && (
            <div className="space-y-4 mt-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <MemoryCardSkeleton key={i} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
        </TabPanel>
      </Tabs>

      {/* Share modal */}
      <Modal
        open={!!shareMemory}
        onClose={() => {
          setShareMemory(null);
          setShareComment("");
        }}
        title="Compartir recuerdo"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShareMemory(null);
                setShareComment("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleShare}
              loading={sharing}
              leftIcon={<Share2 size={15} />}
            >
              Compartir
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <textarea
            value={shareComment}
            onChange={(e) => setShareComment(e.target.value)}
            placeholder="Añade un comentario a tu recuerdo... (opcional)"
            className="input-base resize-none"
            rows={3}
            autoFocus
          />
          {shareMemory && (
            <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                📅 Hace {shareMemory.years_ago}{" "}
                {shareMemory.years_ago === 1 ? "año" : "años"}
              </p>
              <p className="line-clamp-3">
                {shareMemory.post_content ?? "Publicación con multimedia"}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Preferences modal */}
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}

// ─── Memory card ──────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  onView,
  onShare,
  compact,
}: {
  memory: MemoryWithPost;
  onView: () => void;
  onShare: () => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const mediaUrls: string[] = Array.isArray(memory.post_media_urls)
    ? memory.post_media_urls
    : [];

  const originalDate = new Date(memory.post_created_at);

  return (
    <article
      className={cn(
        "surface overflow-hidden animate-fade-in-up",
        !memory.is_viewed && "ring-2 ring-amber-300 dark:ring-amber-600",
      )}
      onClick={onView}
    >
      {/* Memory header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-900/30">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0">
          <Clock size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            📅 Hace {memory.years_ago} {memory.years_ago === 1 ? "año" : "años"}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400/80">
            {format(originalDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        {!memory.is_viewed && (
          <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full shrink-0">
            Nuevo
          </span>
        )}
      </div>

      {/* Post content */}
      <div className="p-4">
        {memory.post_content && (
          <div className="mb-3">
            <p
              className={cn(
                "text-slate-800 dark:text-slate-100 text-[0.9375rem] leading-relaxed",
                !expanded && memory.post_content.length > 200 && "line-clamp-3",
              )}
            >
              {memory.post_content}
            </p>
            {memory.post_content.length > 200 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-1 hover:underline"
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>
        )}

        {/* Media */}
        {mediaUrls.length > 0 && (
          <div
            className={cn(
              "rounded-xl overflow-hidden mb-3",
              mediaUrls.length > 1 && "grid grid-cols-2 gap-1",
            )}
          >
            {mediaUrls
              .slice(0, compact ? 1 : 4)
              .map((url: string, i: number) => (
                <div key={i} className="relative bg-slate-100 dark:bg-gray-800">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className={cn(
                      "w-full object-cover",
                      mediaUrls.length === 1
                        ? "max-h-64 rounded-xl"
                        : "aspect-square",
                    )}
                    loading="lazy"
                  />
                  {i === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                      <span className="text-white text-xl font-bold">
                        +{mediaUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            Compartir recuerdo
          </Button>
          {!memory.is_viewed && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Eye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              Marcar visto
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Preferences modal ────────────────────────────────────────────────────────

function PreferencesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const { data: prefs, loading } = useApi(
    () => memoriesApi.getPreferences(),
    [],
  );
  const [local, setLocal] = useState<Partial<MemoryPreferences>>({});
  const [saving, setSaving] = useState(false);

  useState(() => {
    if (prefs) setLocal(prefs);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await memoriesApi.updatePreferences({
        enabled: local.enabled,
        show_notifications: local.show_notifications,
        min_years_ago: local.min_years_ago,
      });
      toast.success("Preferencias guardadas");
      onClose();
    } catch {
      toast.error("Error al guardar preferencias");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preferencias de recuerdos"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Guardar
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <PrefRow
            label="Mostrar recuerdos"
            description="Activa o desactiva completamente la función de recuerdos"
            checked={local.enabled ?? true}
            onChange={(v) => setLocal((p) => ({ ...p, enabled: v }))}
          />
          <PrefRow
            label="Notificaciones"
            description="Recibe notificaciones cuando tengas recuerdos nuevos"
            checked={local.show_notifications ?? true}
            onChange={(v) => setLocal((p) => ({ ...p, show_notifications: v }))}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
              Años mínimos para mostrar recuerdos
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 5].map((y) => (
                <button
                  key={y}
                  onClick={() => setLocal((p) => ({ ...p, min_years_ago: y }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                    (local.min_years_ago ?? 1) === y
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700",
                  )}
                >
                  {y} {y === 1 ? "año" : "años"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function PrefRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0",
          checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        <span
          className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
          style={{
            transform: checked ? "translateX(20px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupMemoriesByYear(
  memories: MemoryWithPost[],
): Array<{ year: number; memories: MemoryWithPost[] }> {
  const map = new Map<number, MemoryWithPost[]>();
  for (const m of memories) {
    const group = map.get(m.years_ago) ?? [];
    group.push(m);
    map.set(m.years_ago, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, memories]) => ({ year, memories }));
}

function MemoryCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20">
        <Skeleton className="w-9 h-9 shrink-0" rounded />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
        <Skeleton className="h-32 w-full rounded-xl mt-2" />
        <Skeleton className="h-8 w-36 mt-2" />
      </div>
    </div>
  );
}

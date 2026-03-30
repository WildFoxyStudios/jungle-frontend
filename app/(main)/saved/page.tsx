"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkX,
  FolderPlus,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Globe,
  Grid3X3,
  List,
  Search,
  X,
} from "lucide-react";
import { postsApi } from "@/lib/api-posts";
import { collectionsApi } from "@/lib/api-collections";
import { useApi, useMutation, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getProxyUrl } from "@/lib/media-proxy";
import type { Post, Collection } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // ── Collections ────────────────────────────────────────────────────────────
  const {
    data: collections,
    loading: loadingCollections,
    refresh: refreshCollections,
  } = useApi(() => collectionsApi.list(), []);

  // ── Saved posts ────────────────────────────────────────────────────────────
  const {
    items: savedPosts,
    loading: loadingPosts,
    loadingMore,
    hasMore,
    loadMore,
    refresh: refreshPosts,
  } = useInfiniteApi(
    (offset, limit) => postsApi.getSavedPosts(limit, offset),
    [activeCollection],
    16,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  // ── Delete collection ──────────────────────────────────────────────────────
  const { execute: deleteCollection } = useMutation((id: string) =>
    collectionsApi.delete(id),
  );

  const handleDeleteCollection = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la colección "${name}"?`)) return;
    await deleteCollection(id);
    refreshCollections();
    if (activeCollection === id) setActiveCollection(null);
    toast.success(`Colección "${name}" eliminada`);
  };

  // ── Unsave post ────────────────────────────────────────────────────────────
  const { execute: unsavePost } = useMutation((id: string) =>
    postsApi.unsavePost(id),
  );

  const handleUnsave = async (postId: string) => {
    await unsavePost(postId);
    refreshPosts();
    toast.info("Publicación eliminada de guardados");
  };

  // ── Filter by search ───────────────────────────────────────────────────────
  const filteredPosts = debouncedSearch
    ? savedPosts.filter(
        (p) =>
          p.content?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.user_name?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : savedPosts;

  const activeCollectionData = collections?.find(
    (c) => c.id === activeCollection,
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Bookmark
              size={22}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Guardado
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {savedPosts.length} publicación
              {savedPosts.length !== 1 ? "es" : ""} guardada
              {savedPosts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              )}
              title="Vista de cuadrícula"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              )}
              title="Vista de lista"
            >
              <List size={16} />
            </button>
          </div>
          <Button
            leftIcon={<FolderPlus size={16} />}
            variant="secondary"
            onClick={() => setCreateOpen(true)}
          >
            <span className="hidden sm:inline">Nueva colección</span>
          </Button>
        </div>
      </div>

      {/* ── Mobile collection bar ─────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-1 -mx-1 px-1">
        <button
          onClick={() => setActiveCollection(null)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all",
            activeCollection === null
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400",
          )}
        >
          <Bookmark size={13} />
          Todos
        </button>
        {collections?.map((col) => (
          <button
            key={col.id}
            onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all",
              activeCollection === col.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400",
            )}
          >
            <Folder size={13} />
            {col.name}
            {col.is_private && <Lock size={10} />}
          </button>
        ))}
        <button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400"
        >
          <Plus size={13} />
          Nueva
        </button>
      </div>

      <div className="flex gap-5">
        {/* ── Sidebar: collections ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
            Colecciones
          </p>

          {/* All saved */}
          <SidebarItem
            icon={<Bookmark size={17} />}
            label="Todos los guardados"
            count={savedPosts.length}
            active={activeCollection === null}
            onClick={() => setActiveCollection(null)}
          />

          {/* Collections */}
          {loadingCollections &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                <Skeleton className="w-5 h-5 shrink-0" rounded />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}

          {!loadingCollections &&
            collections?.map((col) => (
              <div key={col.id} className="group relative">
                <SidebarItem
                  icon={
                    activeCollection === col.id ? (
                      <FolderOpen size={17} />
                    ) : (
                      <Folder size={17} />
                    )
                  }
                  label={col.name}
                  count={col.items_count}
                  active={activeCollection === col.id}
                  onClick={() =>
                    setActiveCollection(
                      activeCollection === col.id ? null : col.id,
                    )
                  }
                  badge={col.is_private ? <Lock size={11} /> : undefined}
                />
                {/* Collection actions */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dropdown
                    trigger={
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    }
                    items={[
                      {
                        label: "Editar",
                        icon: <Pencil size={13} />,
                        onClick: () => setEditCollection(col),
                      },
                      { separator: true as const },
                      {
                        label: "Eliminar colección",
                        icon: <Trash2 size={13} />,
                        onClick: () => handleDeleteCollection(col.id, col.name),
                        danger: true,
                      },
                    ]}
                  />
                </div>
              </div>
            ))}

          {!loadingCollections &&
            (!collections || collections.length === 0) && (
              <p className="text-xs text-slate-400 dark:text-slate-500 px-3 py-2">
                Sin colecciones aún
              </p>
            )}

          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium mt-1"
          >
            <Plus size={16} />
            Nueva colección
          </button>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {activeCollectionData ? (
                <>
                  <FolderOpen size={18} className="text-indigo-500" />
                  {activeCollectionData.name}
                  <span className="text-slate-400 font-normal text-sm">
                    · {activeCollectionData.items_count} publicaciones
                  </span>
                </>
              ) : (
                <>
                  <Bookmark size={18} className="text-indigo-500" />
                  Todos los guardados
                </>
              )}
            </h2>

            {/* Search */}
            <div className="relative max-w-[240px] flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                placeholder="Buscar guardados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm bg-slate-100 dark:bg-gray-800 rounded-xl border border-transparent focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-400 transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loadingPosts && (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 gap-3"
                  : "space-y-3",
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SavedPostSkeleton key={i} grid={viewMode === "grid"} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingPosts && filteredPosts.length === 0 && (
            <EmptyState
              icon={search ? <Search size={32} /> : <BookmarkX size={32} />}
              title={
                search
                  ? "Sin resultados"
                  : activeCollection
                    ? "Colección vacía"
                    : "Sin publicaciones guardadas"
              }
              description={
                search
                  ? `No hay publicaciones guardadas que coincidan con "${search}".`
                  : activeCollection
                    ? "Esta colección está vacía. Guarda publicaciones y asígnalas aquí."
                    : "Guarda publicaciones para verlas más tarde. Toca el ícono de guardar en cualquier publicación."
              }
              className="py-20"
            />
          )}

          {/* Posts */}
          {!loadingPosts && filteredPosts.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredPosts.map((post, i) => (
                    <SavedPostGrid
                      key={post.id}
                      post={post}
                      index={i}
                      onUnsave={() => handleUnsave(post.id)}
                      collections={collections ?? []}
                      onMoved={refreshPosts}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post, i) => (
                    <SavedPostList
                      key={post.id}
                      post={post}
                      index={i}
                      onUnsave={() => handleUnsave(post.id)}
                      collections={collections ?? []}
                      onMoved={refreshPosts}
                    />
                  ))}
                </div>
              )}

              {loadingMore && (
                <div
                  className={cn(
                    "mt-3",
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 gap-3"
                      : "space-y-3",
                  )}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SavedPostSkeleton key={i} grid={viewMode === "grid"} />
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="h-1" />

              {!hasMore && filteredPosts.length > 0 && (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">
                  Has visto todos los guardados
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit collection modal */}
      <CollectionModal
        open={createOpen || !!editCollection}
        collection={editCollection ?? undefined}
        onClose={() => {
          setCreateOpen(false);
          setEditCollection(null);
        }}
        onSaved={() => {
          refreshCollections();
          setCreateOpen(false);
          setEditCollection(null);
          toast.success(
            editCollection ? "Colección actualizada" : "Colección creada",
          );
        }}
      />
    </div>
  );
}

// ─── Sidebar item ─────────────────────────────────────────────────────────────

function SidebarItem({
  icon,
  label,
  count,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all",
        active
          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-slate-100",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-sm truncate">{label}</span>
      {badge && (
        <span className="text-slate-400 dark:text-slate-500 shrink-0">
          {badge}
        </span>
      )}
      {count !== undefined && (
        <span
          className={cn(
            "text-[11px] font-bold shrink-0 px-1.5 py-0.5 rounded-full",
            active
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              : "bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-400",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Saved post (grid view) ───────────────────────────────────────────────────

function SavedPostGrid({
  post,
  index,
  onUnsave,
  collections,
  onMoved,
}: {
  post: Post;
  index: number;
  onUnsave: () => void;
  collections: Collection[];
  onMoved: () => void;
}) {
  const toast = useToast();
  const firstMedia = post.media_urls?.[0];

  return (
    <div
      className={cn(
        "group surface overflow-hidden hover:shadow-md transition-all duration-200 animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Media / Content preview */}
      <Link href={`/home?post=${post.id}`} className="block">
        {firstMedia ? (
          <div className="relative aspect-square bg-slate-100 dark:bg-gray-800 overflow-hidden">
            {firstMedia.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={getProxyUrl(firstMedia)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
              />
            ) : (
              <img
                src={getProxyUrl(firstMedia)}
                alt={post.content ?? ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            )}
            {(post.media_urls?.length ?? 0) > 1 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded-lg">
                <Grid3X3 size={10} />
                {post.media_urls?.length}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4 text-center leading-relaxed">
              {post.content}
            </p>
          </div>
        )}
      </Link>

      {/* Footer */}
      <div className="p-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {post.user_name ?? "Usuario"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>

        {/* Actions */}
        <Dropdown
          trigger={
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={15} />
            </button>
          }
          items={[
            ...collections.map((col) => ({
              label: `Mover a "${col.name}"`,
              icon: <Folder size={13} />,
              onClick: async () => {
                await collectionsApi.addPost({
                  post_id: post.id,
                  collection_id: col.id,
                });
                onMoved();
                toast.success(`Movido a "${col.name}"`);
              },
            })),
            ...(collections.length > 0 ? [{ separator: true as const }] : []),
            {
              label: "Quitar de guardados",
              icon: <BookmarkX size={13} />,
              onClick: onUnsave,
              danger: true,
            },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Saved post (list view) ───────────────────────────────────────────────────

function SavedPostList({
  post,
  index,
  onUnsave,
  collections,
  onMoved,
}: {
  post: Post;
  index: number;
  onUnsave: () => void;
  collections: Collection[];
  onMoved: () => void;
}) {
  const toast = useToast();
  const firstMedia = post.media_urls?.[0];

  return (
    <div
      className={cn(
        "surface flex gap-3 p-3 hover:shadow-md transition-all group animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Thumbnail */}
      <Link
        href={`/home?post=${post.id}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 shrink-0"
      >
        {firstMedia ? (
          firstMedia.match(/\.(mp4|webm|mov)$/i) ? (
            <video
              src={firstMedia}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <img
              src={firstMedia}
              alt={post.content ?? ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bookmark
              size={24}
              className="text-slate-300 dark:text-slate-600"
            />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {post.user_name ?? "Usuario"}
              </p>
              {post.content && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                  {post.content}
                </p>
              )}
            </div>
            <Dropdown
              trigger={
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={16} />
                </button>
              }
              items={[
                ...collections.map((col) => ({
                  label: `Mover a "${col.name}"`,
                  icon: <Folder size={13} />,
                  onClick: async () => {
                    await collectionsApi.addPost({
                      post_id: post.id,
                      collection_id: col.id,
                    });
                    onMoved();
                    toast.success(`Movido a "${col.name}"`);
                  },
                })),
                ...(collections.length > 0
                  ? [{ separator: true as const }]
                  : []),
                {
                  label: "Quitar de guardados",
                  icon: <BookmarkX size={13} />,
                  onClick: onUnsave,
                  danger: true,
                },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span>❤️</span>
            {post.reactions_count}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            💬 {post.comments_count}
          </span>
          {post.visibility && (
            <span className="text-xs text-slate-300 dark:text-slate-600">
              {post.visibility === "public"
                ? "🌍"
                : post.visibility === "friends"
                  ? "👥"
                  : "🔒"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Collection modal ─────────────────────────────────────────────────────────

function CollectionModal({
  open,
  collection,
  onClose,
  onSaved,
}: {
  open: boolean;
  collection?: Collection;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [isPrivate, setIsPrivate] = useState(collection?.is_private ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (collection) {
        await collectionsApi.update(collection.id, {
          name: name.trim(),
          description: description || undefined,
          is_private: isPrivate,
        });
      } else {
        await collectionsApi.create({
          name: name.trim(),
          description: description || undefined,
          is_private: isPrivate,
        });
      }
      onSaved();
    } catch {
      toast.error("Error al guardar la colección");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={collection ? "Editar colección" : "Nueva colección"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!name.trim()}>
            {collection ? "Guardar cambios" : "Crear colección"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Ej: Recetas favoritas, Viajes pendientes..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
          <p className="text-xs text-slate-400 text-right">{name.length}/60</p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            placeholder="Describe de qué trata esta colección..."
            rows={2}
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Privacy */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-start gap-3">
            {isPrivate ? (
              <Lock size={18} className="text-slate-500 shrink-0 mt-0.5" />
            ) : (
              <Globe size={18} className="text-slate-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {isPrivate ? "Colección privada" : "Colección pública"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isPrivate
                  ? "Solo tú puedes ver esta colección"
                  : "Cualquiera que visite tu perfil puede verla"}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={isPrivate}
            onClick={() => setIsPrivate((v) => !v)}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0 ${
              isPrivate ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
              style={{
                transform: isPrivate ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SavedPostSkeleton({ grid }: { grid: boolean }) {
  if (grid) {
    return (
      <div className="surface overflow-hidden">
        <Skeleton className="aspect-square rounded-none" />
        <div className="p-3 flex items-center gap-2">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface flex gap-3 p-3">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-24 mt-2" />
      </div>
    </div>
  );
}

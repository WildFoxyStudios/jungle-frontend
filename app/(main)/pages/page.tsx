"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Flag,
  Plus,
  Search,
  Users,
  CheckCircle,
  MoreHorizontal,
  Globe,
  Star,
  ThumbsUp,
  X,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { pagesApi } from "@/lib/api-pages";
import { useApi, useMutation } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Page, PageCategory } from "@/lib/types";
import type { CreatePagePayload } from "@/lib/api-pages";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PagesListPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-sm">
            <Flag size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Páginas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Descubre y gestiona páginas de marcas y comunidades
            </p>
          </div>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Crear página
        </Button>
      </div>

      <Tabs defaultTab="discover">
        <div className="surface mb-4">
          <TabList className="px-2">
            <Tab value="discover">Descubrir</Tab>
            <Tab value="mine">Mis páginas</Tab>
          </TabList>
        </div>

        <TabPanel value="discover">
          <DiscoverTab search={debouncedSearch} onSearchChange={setSearch} />
        </TabPanel>
        <TabPanel value="mine">
          <MyPagesTab onCreatePage={() => setCreateOpen(true)} />
        </TabPanel>
      </Tabs>

      <CreatePageModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          toast.success("¡Página creada exitosamente!");
        }}
      />
    </div>
  );
}

// ─── Discover Tab ─────────────────────────────────────────────────────────────

function DiscoverTab({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    pagesApi.listPaginated({ limit: 12 })
      .then((res) => {
        setPages(res.data);
        setNextCursor(res.next_cursor ?? undefined);
        setHasMore(res.has_more);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await pagesApi.listPaginated({ limit: 12, cursor: nextCursor });
      setPages((prev) => [...prev, ...res.data]);
      setNextCursor(res.next_cursor ?? undefined);
      setHasMore(res.has_more);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const filtered = search
    ? pages.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : pages;

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Buscar páginas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-base pl-10 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PageCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Flag size={32} />}
          title="Sin páginas"
          description={
            search
              ? `No encontramos páginas para "${search}".`
              : "No hay páginas publicadas por el momento."
          }
          className="py-20"
        />
      )}

      {/* Pages grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((page, i) => (
            <PageCard key={page.id} page={page} index={i} />
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PageCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && filtered.length > 0 && (
        <p className="text-center text-sm text-slate-400 py-4">
          Has visto todas las páginas
        </p>
      )}
    </div>
  );
}

// ─── My Pages Tab ─────────────────────────────────────────────────────────────

function MyPagesTab({ onCreatePage }: { onCreatePage: () => void }) {
  const toast = useToast();
  const { data: pages, loading, refresh } = useApi(() => pagesApi.getMine(), []);
  const { execute: deletePage } = useMutation((id: string) =>
    pagesApi.delete(id),
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la página "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePage(id);
      refresh();
      toast.success(`Página "${name}" eliminada`);
    } catch {
      toast.error("Error al eliminar la página");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PageCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <EmptyState
        icon={<Flag size={32} />}
        title="No tienes páginas"
        description="Crea una página para tu marca, negocio o comunidad y conecta con tu audiencia."
        action={
          <Button leftIcon={<Plus size={15} />} onClick={onCreatePage}>
            Crear mi primera página
          </Button>
        }
        className="py-20"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {pages.map((page, i) => (
        <PageCard
          key={page.id}
          page={page}
          index={i}
          isOwner
          onDelete={() => handleDelete(page.id, page.name)}
        />
      ))}
    </div>
  );
}

// ─── Page card ────────────────────────────────────────────────────────────────

function PageCard({
  page,
  index,
  isOwner,
  onDelete,
}: {
  page: Page;
  index: number;
  isOwner?: boolean;
  onDelete?: () => void;
}) {
  const toast = useToast();
  const [followed, setFollowed] = useState(false);
  const { execute: followPage } = useMutation(() => pagesApi.follow(page.id));
  const { execute: unfollowPage } = useMutation(() => pagesApi.unfollow(page.id));

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    const wasFollowed = followed;
    setFollowed(!wasFollowed);
    try {
      if (wasFollowed) {
        await unfollowPage();
        toast.info(`Dejaste de seguir "${page.name}"`);
      } else {
        await followPage();
        toast.success(`¡Ahora sigues a "${page.name}"!`);
      }
    } catch {
      setFollowed(wasFollowed);
      toast.error("Error al actualizar");
    }
  };

  return (
    <div
      className={cn(
        "surface overflow-hidden flex flex-col hover:shadow-lg transition-all duration-200 animate-fade-in-up group",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Cover */}
      <div className="relative h-28 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 overflow-hidden">
        {page.cover_url && (
          <img
            src={page.cover_url}
            alt={page.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}
        {/* Actions overlay */}
        <div className="absolute top-2 right-2">
          {isOwner && onDelete ? (
            <Dropdown
              trigger={
                <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                  <MoreHorizontal size={15} />
                </button>
              }
              items={[
                {
                  label: "Editar página",
                  icon: <Pencil size={13} />,
                  onClick: () => {},
                },
                { separator: true as const },
                {
                  label: "Eliminar página",
                  icon: <Trash2 size={13} />,
                  onClick: onDelete,
                  danger: true,
                },
              ]}
            />
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Avatar + info */}
        <div className="flex items-start gap-3 -mt-10">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-900 shadow-md shrink-0 overflow-hidden">
            {page.picture_url ? (
              <img
                src={page.picture_url}
                alt={page.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-400">
                <Flag size={22} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 mt-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/pages/${page.id}`}>
                <h3 className="font-bold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                  {page.name}
                </h3>
              </Link>
              {page.verified && (
                <CheckCircle
                  size={15}
                  className="text-blue-500 shrink-0"
                  fill="currentColor"
                />
              )}
            </div>
            {page.category && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                {page.category.replace(/_/g, " ")}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {page.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {page.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {page.followers_count.toLocaleString()} seguidores
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} />
            {page.likes_count.toLocaleString()} me gusta
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {isOwner ? (
            <Link href={`/pages/${page.id}`} className="flex-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                leftIcon={<ChevronRight size={14} />}
              >
                Gestionar
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              className={cn(
                "flex-1",
                followed
                  ? "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border-slate-200 dark:border-slate-700"
                  : "",
              )}
              leftIcon={followed ? <CheckCircle size={14} /> : <ThumbsUp size={14} />}
              onClick={handleFollow}
            >
              {followed ? "Siguiendo" : "Seguir"}
            </Button>
          )}
          <Link href={`/pages/${page.id}`}>
            <Button size="sm" variant="ghost" leftIcon={<Globe size={14} />}>
              Ver
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PageCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex gap-3 -mt-8">
          <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2 mt-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-xl" />
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Create Page Modal ────────────────────────────────────────────────────────

const PAGE_CATEGORIES: { value: PageCategory; label: string }[] = [
  { value: "local_business", label: "Negocio local" },
  { value: "company", label: "Empresa" },
  { value: "brand", label: "Marca" },
  { value: "artist", label: "Artista" },
  { value: "public_figure", label: "Figura pública" },
  { value: "entertainment", label: "Entretenimiento" },
  { value: "cause", label: "Causa / ONG" },
  { value: "community", label: "Comunidad" },
  { value: "sports", label: "Deportes" },
  { value: "other", label: "Otro" },
];

function CreatePageModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<CreatePagePayload>({
    name: "",
    category: "other",
    description: "",
    username: "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CreatePagePayload>(key: K, value: CreatePagePayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await pagesApi.create({
        ...form,
        name: form.name.trim(),
        username: form.username?.trim() || undefined,
        description: form.description?.trim() || undefined,
      });
      onCreated();
      setForm({ name: "", category: "other", description: "", username: "" });
    } catch {
      toast.error("Error al crear la página");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear nueva página"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            disabled={!form.name.trim()}
            leftIcon={<Flag size={15} />}
          >
            Crear página
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre de la página <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Ej: Mi Marca Oficial"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre de usuario (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              @
            </span>
            <input
              className="input-base pl-7"
              placeholder="mimarca"
              value={form.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
              maxLength={30}
            />
          </div>
          <p className="text-xs text-slate-400">
            Será la URL de tu página: /pages/@{form.username || "mimarca"}
          </p>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            className="input-base"
            value={form.category}
            onChange={(e) => set("category", e.target.value as PageCategory)}
          >
            {PAGE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            placeholder="Describe de qué trata tu página..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-slate-400 text-right">
            {(form.description?.length ?? 0)}/500
          </p>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <Flag size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Tu página será pública y visible para todos los usuarios. Podrás
            personalizarla con foto y portada después de crearla.
          </p>
        </div>
      </div>
    </Modal>
  );
}

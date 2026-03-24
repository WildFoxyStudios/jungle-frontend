"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Flag,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  ThumbsUp,
  Users,
  BarChart2,
  Plus,
  Pencil,
  MoreHorizontal,
  Star,
  Send,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Share2,
  TrendingUp,
} from "lucide-react";
import { pagesApi } from "@/lib/api-pages";
import { useApi, useMutation } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getProxyUrl } from "@/lib/media-proxy";
import type { Page, PagePost } from "@/lib/types";
import type { UpdatePagePayload, PageInsights, ReviewPagePayload } from "@/lib/api-pages";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PageDetailPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const { user } = useAuth();
  const toast = useToast();

  const {
    data: page,
    loading,
    refresh: refreshPage,
  } = useApi(() => pagesApi.get(pageId), [pageId]);

  const { data: posts, loading: loadingPosts, refresh: refreshPosts } = useApi(
    () => pagesApi.getPosts(pageId),
    [pageId],
  );

  const [followed, setFollowed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const isOwner = page?.created_by === user?.id;

  const { execute: followPage } = useMutation(() => pagesApi.follow(pageId));
  const { execute: unfollowPage } = useMutation(() => pagesApi.unfollow(pageId));

  const handleFollow = async () => {
    const wasFollowed = followed;
    setFollowed(!wasFollowed);
    try {
      if (wasFollowed) {
        await unfollowPage();
        toast.info("Dejaste de seguir esta página");
      } else {
        await followPage();
        toast.success("¡Ahora sigues esta página!");
      }
    } catch {
      setFollowed(wasFollowed);
      toast.error("Error al actualizar");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado");
    } catch {
      toast.error("Error al copiar");
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-6">
        <Skeleton className="h-48 w-full rounded-2xl mb-4" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <EmptyState
        icon={<Flag size={40} />}
        title="Página no encontrada"
        description="Esta página no existe o fue eliminada."
        action={
          <Link href="/pages">
            <Button leftIcon={<ArrowLeft size={15} />} variant="secondary">
              Ver todas las páginas
            </Button>
          </Link>
        }
        className="py-24"
      />
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Back */}
      <Link
        href="/pages"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Páginas
      </Link>

      {/* Cover + profile */}
      <div className="surface overflow-hidden">
        {/* Cover */}
        <div className="relative h-48 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500">
          {page.cover_url && (
            <img
              src={page.cover_url}
              alt={page.name}
              className="w-full h-full object-cover"
            />
          )}
          {/* Actions overlay */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              title="Compartir"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Info section */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between gap-4 -mt-10 mb-4 flex-wrap">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-white dark:bg-gray-900 shrink-0">
              {page.picture_url ? (
                <img
                  src={page.picture_url}
                  alt={page.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-400">
                  <Flag size={28} className="text-white" />
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 mt-10">
              {isOwner ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Pencil size={14} />}
                    onClick={() => setEditOpen(true)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={() => setCreatePostOpen(true)}
                  >
                    Crear publicación
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={followed ? "secondary" : "primary"}
                    leftIcon={
                      followed ? <CheckCircle size={14} /> : <ThumbsUp size={14} />
                    }
                    onClick={handleFollow}
                  >
                    {followed ? "Siguiendo" : "Seguir"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Star size={14} />}
                    onClick={() => setReviewOpen(true)}
                  >
                    Reseñar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Name & details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
                {page.name}
              </h1>
              {page.verified && (
                <CheckCircle
                  size={20}
                  className="text-blue-500 shrink-0"
                  fill="currentColor"
                />
              )}
              {page.category && (
                <Badge variant="primary" size="sm" className="capitalize">
                  {page.category.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            {page.description && (
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {page.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Users size={14} />
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {page.followers_count.toLocaleString()}
                </span>{" "}
                seguidores
              </span>
              <span className="flex items-center gap-1.5">
                <ThumbsUp size={14} />
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {page.likes_count.toLocaleString()}
                </span>{" "}
                me gusta
              </span>
              {page.website && (
                <a
                  href={page.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe size={14} />
                  {new URL(page.website).hostname}
                </a>
              )}
              {page.email && (
                <a
                  href={`mailto:${page.email}`}
                  className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Mail size={14} />
                  {page.email}
                </a>
              )}
              {page.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {page.city}
                  {page.country && `, ${page.country}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="posts">
        <div className="surface">
          <TabList className="px-2">
            <Tab value="posts">Publicaciones</Tab>
            <Tab value="about">Acerca de</Tab>
            {isOwner && <Tab value="insights">Estadísticas</Tab>}
          </TabList>
        </div>

        {/* Posts tab */}
        <TabPanel value="posts">
          <PostsSection
            posts={posts ?? []}
            loading={loadingPosts}
            page={page}
            isOwner={isOwner}
            onRefresh={refreshPosts}
          />
        </TabPanel>

        {/* About tab */}
        <TabPanel value="about">
          <AboutSection page={page} />
        </TabPanel>

        {/* Insights tab (owner only) */}
        {isOwner && (
          <TabPanel value="insights">
            <InsightsSection pageId={pageId} />
          </TabPanel>
        )}
      </Tabs>

      {/* Edit modal */}
      {editOpen && (
        <EditPageModal
          page={page}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            refreshPage();
            toast.success("Página actualizada");
          }}
        />
      )}

      {/* Review modal */}
      {reviewOpen && (
        <ReviewModal
          pageId={pageId}
          pageName={page.name}
          onClose={() => setReviewOpen(false)}
          onReviewed={() => {
            setReviewOpen(false);
            toast.success("¡Reseña enviada!");
          }}
        />
      )}

      {/* Create post modal */}
      {createPostOpen && (
        <CreatePostModal
          pageId={pageId}
          onClose={() => setCreatePostOpen(false)}
          onCreated={() => {
            setCreatePostOpen(false);
            refreshPosts();
            toast.success("Publicación creada");
          }}
        />
      )}
    </div>
  );
}

// ─── Posts section ────────────────────────────────────────────────────────────

function PostsSection({
  posts,
  loading,
  page,
  isOwner,
  onRefresh,
}: {
  posts: PagePost[];
  loading: boolean;
  page: Page;
  isOwner: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface p-5 space-y-3">
            <div className="flex gap-3 items-center">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon={<Flag size={32} />}
        title="Sin publicaciones"
        description={
          isOwner
            ? "Crea tu primera publicación para compartir contenido con tus seguidores."
            : "Esta página aún no ha publicado contenido."
        }
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => (
        <PagePostCard key={post.id} post={post} page={page} index={i} />
      ))}
    </div>
  );
}

// ─── Page post card ───────────────────────────────────────────────────────────

function PagePostCard({
  post,
  page,
  index,
}: {
  post: PagePost;
  page: Page;
  index: number;
}) {
  return (
    <div
      className={cn(
        "surface p-5 animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shrink-0">
          {page.picture_url ? (
            <img
              src={page.picture_url}
              alt={page.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Flag size={18} className="text-white" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm text-slate-900 dark:text-slate-50">
              {page.name}
            </p>
            {page.verified && (
              <CheckCircle size={13} className="text-blue-500" fill="currentColor" />
            )}
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: es,
            })}
            {!post.is_published && (
              <span className="ml-2 text-amber-500 font-medium">• Borrador</span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-slate-800 dark:text-slate-100 leading-relaxed mb-3">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div
          className={cn(
            "grid gap-2 mb-3",
            post.media_urls.length === 1
              ? "grid-cols-1"
              : post.media_urls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2",
          )}
        >
          {post.media_urls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={cn(
                "relative rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800",
                post.media_urls!.length === 1 ? "aspect-video" : "aspect-square",
              )}
            >
              <img
                src={getProxyUrl(url)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {i === 3 && post.media_urls!.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-black">
                    +{post.media_urls!.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link */}
      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors mb-3"
        >
          <Globe size={14} className="shrink-0" />
          <span className="truncate">{post.link_url}</span>
        </a>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <ThumbsUp size={14} />
          {post.likes_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5">
          💬 {post.comments_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5">
          ↗️ {post.shares_count.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── About section ────────────────────────────────────────────────────────────

function AboutSection({ page }: { page: Page }) {
  const hasAbout =
    page.about || page.website || page.email || page.phone ||
    page.address || page.city || page.country;

  if (!hasAbout) {
    return (
      <EmptyState
        icon={<Flag size={28} />}
        title="Sin información adicional"
        description="Esta página no ha añadido información de contacto."
        className="py-12"
      />
    );
  }

  return (
    <div className="surface p-6 space-y-5">
      {page.about && (
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Acerca de
          </h3>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            {page.about}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Contacto
        </h3>
        {page.website && (
          <div className="flex items-center gap-3 text-sm">
            <Globe size={16} className="text-blue-500 shrink-0" />
            <a
              href={page.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {page.website}
            </a>
          </div>
        )}
        {page.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-slate-400 shrink-0" />
            <a href={`mailto:${page.email}`} className="text-slate-700 dark:text-slate-200">
              {page.email}
            </a>
          </div>
        )}
        {page.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-slate-400 shrink-0" />
            <a href={`tel:${page.phone}`} className="text-slate-700 dark:text-slate-200">
              {page.phone}
            </a>
          </div>
        )}
        {(page.address || page.city) && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin size={16} className="text-slate-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              {[page.address, page.city, page.country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Insights section ─────────────────────────────────────────────────────────

function InsightsSection({ pageId }: { pageId: string }) {
  const { data: insights, loading } = useApi(
    () => pagesApi.getInsights(pageId),
    [pageId],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!insights) {
    return (
      <EmptyState
        icon={<BarChart2 size={32} />}
        title="Sin estadísticas"
        description="Las estadísticas estarán disponibles una vez que tu página tenga actividad."
        className="py-12"
      />
    );
  }

  const stats = [
    {
      label: "Total seguidores",
      value: insights.total_followers.toLocaleString(),
      icon: "👥",
      color: "from-blue-400 to-indigo-500",
    },
    {
      label: "Nuevos (7 días)",
      value: `+${insights.new_followers_7d.toLocaleString()}`,
      icon: "📈",
      color: "from-green-400 to-emerald-500",
    },
    {
      label: "Nuevos (30 días)",
      value: `+${insights.new_followers_30d.toLocaleString()}`,
      icon: "📊",
      color: "from-teal-400 to-cyan-500",
    },
    {
      label: "Publicaciones",
      value: insights.total_posts.toLocaleString(),
      icon: "📝",
      color: "from-violet-400 to-purple-500",
    },
    {
      label: "Tasa de participación",
      value: `${(insights.engagement_rate * 100).toFixed(1)}%`,
      icon: "⚡",
      color: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={18} className="text-indigo-500" />
        <h2 className="font-bold text-slate-800 dark:text-slate-100">
          Estadísticas de tu página
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={cn(
              "surface p-5 flex flex-col gap-3 animate-fade-in-up",
              `stagger-${i + 1}`,
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg shadow-sm",
                stat.color,
              )}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Edit Page Modal ──────────────────────────────────────────────────────────

function EditPageModal({
  page,
  onClose,
  onSaved,
}: {
  page: Page;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<UpdatePagePayload>({
    name: page.name,
    description: page.description ?? "",
    about: page.about ?? "",
    website: page.website ?? "",
    email: page.email ?? "",
    phone: page.phone ?? "",
    address: page.address ?? "",
    city: page.city ?? "",
    country: page.country ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof UpdatePagePayload>(key: K, value: UpdatePagePayload[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await pagesApi.update(page.id, {
        ...form,
        name: form.name?.trim() || page.name,
        description: form.description?.trim() || undefined,
        about: form.about?.trim() || undefined,
        website: form.website?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        city: form.city?.trim() || undefined,
        country: form.country?.trim() || undefined,
      });
      onSaved();
    } catch {
      toast.error("Error al actualizar la página");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar página"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
          <input className="input-base" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción corta</label>
          <textarea className="input-base resize-none" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={500} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Acerca de</label>
          <textarea className="input-base resize-none" rows={3} value={form.about} onChange={(e) => set("about", e.target.value)} maxLength={2000} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sitio web</label>
            <input className="input-base" type="url" placeholder="https://..." value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo</label>
            <input className="input-base" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
            <input className="input-base" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciudad</label>
            <input className="input-base" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
          <input className="input-base" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">País</label>
          <input className="input-base" value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  pageId,
  pageName,
  onClose,
  onReviewed,
}: {
  pageId: string;
  pageName: string;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await pagesApi.review(pageId, { rating, comment: comment.trim() || undefined });
      onReviewed();
    } catch {
      toast.error("Error al enviar la reseña");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reseñar: ${pageName}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving} leftIcon={<Star size={15} />}>
            Publicar reseña
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Star rating */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Calificación
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={cn(
                  "text-3xl transition-all hover:scale-110",
                  star <= rating ? "text-yellow-400" : "text-slate-200 dark:text-slate-700",
                )}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Comentario (opcional)
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            placeholder="Comparte tu experiencia con esta página..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({
  pageId,
  onClose,
  onCreated,
}: {
  pageId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!content.trim() && !linkUrl.trim()) return;
    setSaving(true);
    try {
      await pagesApi.createPost(pageId, {
        content: content.trim() || undefined,
        link_url: linkUrl.trim() || undefined,
      });
      onCreated();
    } catch {
      toast.error("Error al crear la publicación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva publicación"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            disabled={!content.trim() && !linkUrl.trim()}
            leftIcon={<Send size={15} />}
          >
            Publicar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <textarea
          className="input-base resize-none min-h-[120px]"
          placeholder="¿Qué quieres compartir con tus seguidores?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Enlace (opcional)
          </label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="url"
              className="input-base pl-9"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

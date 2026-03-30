"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  HeartHandshake,
  Search,
  Plus,
  Users,
  Clock,
  CheckCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  ChevronRight,
  X,
} from "lucide-react";
import { fundraisersApi } from "@/lib/api-fundraisers";
import { useInfiniteApi, useApi, useMutation } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Fundraiser, FundraiserCategory } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FundraisersPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [donateTarget, setDonateTarget] = useState<Fundraiser | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: categories } = useApi(() => fundraisersApi.getCategories(), []);

  const {
    items: fundraisers,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) =>
      fundraisersApi.list({
        category_id: activeCategory ?? undefined,
        limit,
        offset,
      }),
    [activeCategory],
    12,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const {
    data: myFundraisers,
    loading: loadingMine,
    refresh: refreshMine,
  } = useApi(() => fundraisersApi.getMy(), []);

  const filtered = debouncedSearch
    ? fundraisers.filter(
        (f) =>
          f.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          f.description?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : fundraisers;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shadow-sm">
            <HeartHandshake
              size={22}
              className="text-rose-600 dark:text-rose-400"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Recaudaciones
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Apoya causas que importan
            </p>
          </div>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          <span className="hidden sm:inline">Crear recaudación</span>
          <span className="sm:hidden">Crear</span>
        </Button>
      </div>

      <Tabs defaultTab="discover">
        <div className="surface mb-4">
          <TabList className="px-2">
            <Tab value="discover">Descubrir</Tab>
            <Tab value="mine">Mis recaudaciones</Tab>
          </TabList>
        </div>

        {/* Discover */}
        <TabPanel value="discover">
          <div className="space-y-5">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                placeholder="Buscar recaudaciones..."
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
            {categories && categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                    !activeCategory
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700",
                  )}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setActiveCategory(
                        activeCategory === cat.id ? null : cat.id,
                      )
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                      activeCategory === cat.id
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700",
                    )}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Featured / urgent fundraisers */}
            {!loading && !debouncedSearch && filtered.length > 0 && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp
                    size={18}
                    className="text-rose-600 dark:text-rose-400"
                  />
                  <h2 className="font-bold text-rose-800 dark:text-rose-300">
                    Necesitan tu apoyo ahora
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {filtered.slice(0, 3).map((f) => (
                    <UrgentFundraiserCard
                      key={f.id}
                      fundraiser={f}
                      onDonate={() => setDonateTarget(f)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All fundraisers grid */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <FundraiserCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <EmptyState
                icon={<HeartHandshake size={36} />}
                title="Sin recaudaciones"
                description={
                  debouncedSearch
                    ? `No encontramos recaudaciones para "${debouncedSearch}".`
                    : "No hay recaudaciones activas por el momento."
                }
                action={
                  <Button
                    leftIcon={<Plus size={15} />}
                    onClick={() => setCreateOpen(true)}
                  >
                    Crear recaudación
                  </Button>
                }
                className="py-16"
              />
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(debouncedSearch ? filtered : filtered.slice(3)).map(
                  (f, i) => (
                    <FundraiserCard
                      key={f.id}
                      fundraiser={f}
                      index={i}
                      onDonate={() => setDonateTarget(f)}
                    />
                  ),
                )}
              </div>
            )}

            {loadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <FundraiserCardSkeleton key={i} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />

            {!hasMore && filtered.length > 3 && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                Has visto todas las recaudaciones
              </p>
            )}
          </div>
        </TabPanel>

        {/* My fundraisers */}
        <TabPanel value="mine">
          {loadingMine && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <FundraiserCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loadingMine && (!myFundraisers || myFundraisers.length === 0) && (
            <EmptyState
              icon={<HeartHandshake size={32} />}
              title="No has creado ninguna recaudación"
              description="Crea una recaudación para una causa que te importa y compártela con tu comunidad."
              action={
                <Button
                  leftIcon={<Plus size={15} />}
                  onClick={() => setCreateOpen(true)}
                >
                  Crear mi primera recaudación
                </Button>
              }
              className="py-16"
            />
          )}

          {!loadingMine && myFundraisers && myFundraisers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myFundraisers.map((f, i) => (
                <FundraiserCard
                  key={f.id}
                  fundraiser={f}
                  index={i}
                  onDonate={() => setDonateTarget(f)}
                  isOwner
                  onRefresh={refreshMine}
                />
              ))}
            </div>
          )}
        </TabPanel>
      </Tabs>

      {/* Create modal */}
      <CreateFundraiserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories ?? []}
        onCreated={() => {
          setCreateOpen(false);
          refresh();
          toast.success("¡Recaudación creada exitosamente!");
        }}
      />

      {/* Donate modal */}
      {donateTarget && (
        <DonateModal
          fundraiser={donateTarget}
          onClose={() => setDonateTarget(null)}
          onDonated={() => {
            setDonateTarget(null);
            refresh();
            refreshMine();
          }}
        />
      )}
    </div>
  );
}

// ─── Urgent card (compact) ─────────────────────────────────────────────────────

function UrgentFundraiserCard({
  fundraiser: f,
  onDonate,
}: {
  fundraiser: Fundraiser;
  onDonate: () => void;
}) {
  const pct =
    f.goal_amount > 0
      ? Math.min(100, Math.round((f.raised_amount / f.goal_amount) * 100))
      : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-rose-100 dark:border-rose-900/30 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 mb-2">
        {f.title}
      </h3>
      <Progress value={pct} color="danger" size="sm" className="mb-2" />
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
        <span className="font-bold text-rose-600 dark:text-rose-400">
          ${f.raised_amount.toLocaleString()}
        </span>
        <span>{pct}%</span>
      </div>
      <Button
        size="sm"
        className="w-full bg-rose-600 hover:bg-rose-700 text-white border-0"
        leftIcon={<Heart size={13} />}
        onClick={onDonate}
      >
        Donar
      </Button>
    </div>
  );
}

// ─── Fundraiser card ───────────────────────────────────────────────────────────

function FundraiserCard({
  fundraiser: f,
  index,
  onDonate,
  isOwner,
  onRefresh,
}: {
  fundraiser: Fundraiser;
  index: number;
  onDonate: () => void;
  isOwner?: boolean;
  onRefresh?: () => void;
}) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const { execute: saveFundraiser } = useMutation(() =>
    fundraisersApi.save(f.id),
  );
  const { execute: unsaveFundraiser } = useMutation(() =>
    fundraisersApi.unsave(f.id),
  );
  const { execute: deleteFundraiser } = useMutation(() =>
    fundraisersApi.delete(f.id),
  );

  const pct =
    f.goal_amount > 0
      ? Math.min(100, Math.round((f.raised_amount / f.goal_amount) * 100))
      : 0;

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) await unsaveFundraiser();
      else {
        await saveFundraiser();
        toast.success("Recaudación guardada");
      }
    } catch {
      setSaved(wasSaved);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la recaudación "${f.title}"?`)) return;
    try {
      await deleteFundraiser();
      toast.success("Recaudación eliminada");
      onRefresh?.();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.share?.({
        title: f.title,
        url: `${window.location.origin}/fundraisers/${f.id}`,
      });
    } catch {
      await navigator.clipboard.writeText(
        `${window.location.origin}/fundraisers/${f.id}`,
      );
      toast.success("Enlace copiado");
    }
  };

  const statusColor =
    {
      active:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      completed:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      cancelled:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    }[f.status] ??
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <div
      className={cn(
        "surface flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in-up group",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Image placeholder / gradient */}
      <div className="relative h-40 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-400 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart size={48} className="text-white/20" />
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold",
            statusColor,
          )}
        >
          {f.status === "active"
            ? "Activa"
            : f.status === "completed"
              ? "Completada ✓"
              : "Cancelada"}
        </span>

        {/* Save button */}
        <button
          onClick={handleToggleSave}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow",
            saved
              ? "bg-rose-500 text-white"
              : "bg-white/90 dark:bg-gray-900/90 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-500",
          )}
        >
          {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>

        {/* Progress overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-white transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <Link href={`/fundraisers/${f.id}`}>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors line-clamp-2">
              {f.title}
            </h3>
          </Link>
          {f.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {f.description}
            </p>
          )}
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <Progress value={pct} color="danger" size="sm" />
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-black text-slate-900 dark:text-slate-50 text-base">
                ${f.raised_amount.toLocaleString()}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {" "}
                recaudado de ${f.goal_amount.toLocaleString()}
              </span>
            </div>
            <span
              className={cn(
                "font-bold",
                pct >= 100
                  ? "text-green-600 dark:text-green-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {pct}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {f.donations_count} donaciones
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDistanceToNow(new Date(f.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          {isOwner ? (
            <>
              <Link href={`/fundraisers/${f.id}`} className="flex-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={<ChevronRight size={14} />}
                >
                  Ver detalles
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Eliminar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0"
                leftIcon={<Heart size={14} />}
                onClick={onDonate}
                disabled={f.status !== "active"}
              >
                {f.status === "completed" ? "Completada" : "Donar"}
              </Button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                title="Compartir"
              >
                <Share2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Donate modal ──────────────────────────────────────────────────────────────

function DonateModal({
  fundraiser: f,
  onClose,
  onDonated,
}: {
  fundraiser: Fundraiser;
  onClose: () => void;
  onDonated: () => void;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const [success, setSuccess] = useState(false);

  const PRESETS = [5, 10, 25, 50, 100, 250];
  const pct =
    f.goal_amount > 0
      ? Math.min(100, Math.round((f.raised_amount / f.goal_amount) * 100))
      : 0;

  const handleDonate = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) {
      toast.error("El monto mínimo de donación es $1");
      return;
    }
    setDonating(true);
    try {
      await fundraisersApi.donate(f.id, {
        amount: amt,
        is_anonymous: isAnonymous,
        message: message || undefined,
        payment_method: "card",
      });
      setSuccess(true);
      onDonated();
    } catch {
      toast.error("Error al procesar la donación. Inténtalo de nuevo.");
    } finally {
      setDonating(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={success ? "¡Gracias por tu donación!" : "Donar a esta causa"}
      size="md"
      footer={
        success ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleDonate}
              loading={donating}
              disabled={!amount || parseFloat(amount) < 1}
              className="bg-rose-600 hover:bg-rose-700 text-white border-0"
              leftIcon={<Heart size={15} />}
            >
              Donar ${amount || "0"}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mx-auto shadow-lg">
            <Heart size={36} className="text-white" fill="white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
              ¡Gracias por tu generosidad!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tu donación de{" "}
              <span className="font-bold text-rose-600 dark:text-rose-400">
                ${parseFloat(amount).toLocaleString()}
              </span>{" "}
              ha sido procesada exitosamente.
            </p>
          </div>
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30 text-left">
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
              {f.title}
            </p>
            <Progress
              value={Math.min(
                100,
                pct + Math.round((parseFloat(amount) / f.goal_amount) * 100),
              )}
              color="danger"
              size="sm"
              className="mt-2"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Fundraiser info */}
          <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
              {f.title}
            </h3>
            <div className="mt-3 space-y-1.5">
              <Progress value={pct} color="danger" size="sm" />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  ${f.raised_amount.toLocaleString()} recaudado
                </span>
                <span>Meta: ${f.goal_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Amount presets */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
              Elige un monto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                    amount === String(preset)
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700",
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>
            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Otro monto"
                value={PRESETS.includes(parseInt(amount)) ? "" : amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-base pl-9 text-lg font-bold"
              />
            </div>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mensaje de apoyo (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deja un mensaje de aliento a los organizadores..."
              className="input-base resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Anonymous */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Donar de forma anónima
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tu nombre no será visible públicamente
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isAnonymous}
              onClick={() => setIsAnonymous((v) => !v)}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0",
                isAnonymous
                  ? "bg-indigo-600"
                  : "bg-slate-200 dark:bg-slate-700",
              )}
            >
              <span
                className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
                style={{
                  transform: isAnonymous
                    ? "translateX(20px)"
                    : "translateX(2px)",
                }}
              />
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 p-3.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
            <CheckCircle
              size={16}
              className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-green-700 dark:text-green-300">
              Tu donación está protegida. El 100% de tu contribución va
              directamente a la causa.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Create fundraiser modal ───────────────────────────────────────────────────

function CreateFundraiserModal({
  open,
  onClose,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: FundraiserCategory[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    story: "",
    goal_amount: "",
    currency: "USD",
    category_id: "",
    beneficiary_type: "individual",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const isValid =
    form.title.trim() && form.goal_amount && parseFloat(form.goal_amount) > 0;

  const handleCreate = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await fundraisersApi.create({
        title: form.title.trim(),
        description: form.description || undefined,
        story: form.story || undefined,
        goal_amount: parseFloat(form.goal_amount),
        currency: form.currency,
        category_id: form.category_id || undefined,
        beneficiary_type: form.beneficiary_type || undefined,
      });
      onCreated();
    } catch {
      toast.error("Error al crear la recaudación");
    } finally {
      setSaving(false);
    }
  };

  const BENEFICIARY_TYPES = [
    { value: "individual", label: "Una persona", icon: "👤" },
    { value: "organization", label: "Organización", icon: "🏛️" },
    { value: "animal", label: "Animal", icon: "🐾" },
    { value: "community", label: "Comunidad", icon: "🏘️" },
    { value: "environment", label: "Medioambiente", icon: "🌱" },
    { value: "education", label: "Educación", icon: "📚" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear recaudación"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            disabled={!isValid}
            className="bg-rose-600 hover:bg-rose-700 text-white border-0"
            leftIcon={<HeartHandshake size={15} />}
          >
            Crear recaudación
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Título de la recaudación <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Ej: Ayuda para operación de María, Refugio para perros..."
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            autoFocus
          />
          <p className="text-xs text-slate-400 text-right">
            {form.title.length}/120
          </p>
        </div>

        {/* Goal + currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Meta de recaudación <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min="10"
                step="1"
                placeholder="0"
                className="input-base pl-9 text-lg font-bold"
                value={form.goal_amount}
                onChange={(e) => set("goal_amount", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Moneda
            </label>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="input-base cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="MXN">MXN</option>
              <option value="EUR">EUR (€)</option>
              <option value="COP">COP</option>
              <option value="ARS">ARS</option>
              <option value="CLP">CLP</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción breve
          </label>
          <textarea
            className="input-base resize-none"
            rows={2}
            placeholder="Un resumen corto de para qué es la recaudación..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={300}
          />
        </div>

        {/* Story */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Historia completa
          </label>
          <textarea
            className="input-base resize-none"
            rows={4}
            placeholder="Cuéntanos la historia detrás de esta recaudación. Cuanto más detallada, más probabilidad de recibir apoyo..."
            value={form.story}
            onChange={(e) => set("story", e.target.value)}
            maxLength={5000}
          />
          <p className="text-xs text-slate-400 text-right">
            {form.story.length}/5000
          </p>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Categoría
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    set(
                      "category_id",
                      form.category_id === cat.id ? "" : cat.id,
                    )
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all",
                    form.category_id === cat.id
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700",
                  )}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Beneficiary type */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            ¿Para quién es la recaudación?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BENEFICIARY_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("beneficiary_type", value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                  form.beneficiary_type === value
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700",
                )}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span
                  className={cn(
                    "text-xs font-semibold text-center leading-tight",
                    form.beneficiary_type === value
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-slate-600 dark:text-slate-300",
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
          <HeartHandshake size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Tu recaudación será revisada y publicada automáticamente. Compártela
            con amigos y familia para maximizar el apoyo.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function FundraiserCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2 w-full rounded-full mt-1" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-full mt-1" />
      </div>
    </div>
  );
}

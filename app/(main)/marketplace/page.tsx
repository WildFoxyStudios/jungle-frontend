"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Plus,
  Star,
  MapPin,
  Heart,
  ChevronDown,
  Tag,
  Truck,
  X,
  Check,
  Filter,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api-marketplace";
import { useInfiniteApi, useMutation } from "@/hooks/useApi";
import { useApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type {
  MarketplaceProduct,
  MarketplaceCategory,
  ProductCondition,
} from "@/lib/types";

// ─── Condition labels ─────────────────────────────────────────────────────────

const CONDITIONS: Record<ProductCondition, { label: string; color: string }> = {
  new: {
    label: "Nuevo",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  like_new: {
    label: "Como nuevo",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  good: {
    label: "Buen estado",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  fair: {
    label: "Estado regular",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  poor: {
    label: "Estado pobre",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "recent", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "rating", label: "Mejor valorados" },
];

// ─── Filters state ────────────────────────────────────────────────────────────

interface Filters {
  category_id?: string;
  condition?: ProductCondition;
  min_price?: number;
  max_price?: number;
  sort: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>({ sort: "recent" });

  const debouncedSearch = useDebounce(search, 350);

  // ── Categories ─────────────────────────────────────────────────────────────
  const { data: categories } = useApi(() => marketplaceApi.getCategories(), []);

  // ── Products ───────────────────────────────────────────────────────────────
  const {
    items: products,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) =>
      marketplaceApi.getProducts({
        limit,
        offset,
        category_id: filters.category_id,
        condition: filters.condition,
        min_price: filters.min_price,
        max_price: filters.max_price,
        q: debouncedSearch || undefined,
      }),
    [
      debouncedSearch,
      filters.category_id,
      filters.condition,
      filters.min_price,
      filters.max_price,
    ],
    16,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  // ── Save / unsave ──────────────────────────────────────────────────────────
  const { execute: saveProduct } = useMutation((id: string) =>
    marketplaceApi.saveProduct(id),
  );

  const handleToggleSave = async (id: string, title: string) => {
    const isSaved = saved.has(id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!isSaved) {
      await saveProduct(id);
      toast.success(`"${title}" guardado`);
    }
  };

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilter = <K extends keyof Filters>(key: K) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      next.sort = prev.sort;
      return next;
    });
  };

  const activeFiltersCount = [
    filters.category_id,
    filters.condition,
    filters.min_price,
    filters.max_price,
  ].filter(Boolean).length;

  // ── Sort products client-side ──────────────────────────────────────────────
  const sorted = [...products].sort((a, b) => {
    if (filters.sort === "price_asc") return a.price - b.price;
    if (filters.sort === "price_desc") return b.price - a.price;
    if (filters.sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return 0; // recent: preserve server order
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 pb-24">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
            Marketplace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Compra y vende artículos cerca de ti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/marketplace/orders">
            <Button variant="ghost" size="sm">
              Mis pedidos
            </Button>
          </Link>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Vender artículo
          </Button>
        </div>
      </div>

      {/* ── Search + filters bar ────────────────────────────────────────── */}
      <div className="flex gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar en Marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 input-base"
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

        {/* Filters button */}
        <button
          onClick={() => setFiltersOpen(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
            activeFiltersCount > 0
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700",
          )}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => setFilter("sort", e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 input-base cursor-pointer text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* ── Category chips ───────────────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          <button
            onClick={() => clearFilter("category_id")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
              !filters.category_id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700",
            )}
          >
            <ShoppingBag size={13} />
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                filters.category_id === cat.id
                  ? clearFilter("category_id")
                  : setFilter("category_id", cat.id)
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                filters.category_id === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-700",
              )}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Active filter chips ───────────────────────────────────────────── */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.condition && (
            <FilterChip
              label={CONDITIONS[filters.condition]?.label ?? filters.condition}
              onRemove={() => clearFilter("condition")}
            />
          )}
          {(filters.min_price !== undefined ||
            filters.max_price !== undefined) && (
            <FilterChip
              label={
                filters.min_price !== undefined &&
                filters.max_price !== undefined
                  ? `$${filters.min_price} – $${filters.max_price}`
                  : filters.min_price !== undefined
                    ? `Desde $${filters.min_price}`
                    : `Hasta $${filters.max_price}`
              }
              onRemove={() => {
                clearFilter("min_price");
                clearFilter("max_price");
              }}
            />
          )}
          <button
            onClick={() => setFilters({ sort: filters.sort })}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Product grid ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <EmptyState
          icon={<ShoppingBag size={36} />}
          title="Sin productos"
          description={
            search || activeFiltersCount > 0
              ? "No encontramos productos con esos filtros. Prueba ajustando tu búsqueda."
              : "Aún no hay productos disponibles. ¡Sé el primero en vender algo!"
          }
          action={
            <Button
              leftIcon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
            >
              Vender artículo
            </Button>
          }
          className="py-20"
        />
      )}

      {!loading && sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sorted.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={saved.has(product.id)}
              onToggleSave={() => handleToggleSave(product.id, product.title)}
              index={i}
            />
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && sorted.length > 0 && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">
          Has visto todos los productos disponibles
        </p>
      )}

      {/* ── Filters modal ─────────────────────────────────────────────────── */}
      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        categories={categories ?? []}
        onApply={(applied) => {
          setFilters((prev) => ({ ...prev, ...applied }));
          setFiltersOpen(false);
        }}
      />

      {/* ── Create listing modal ─────────────────────────────────────────── */}
      <CreateListingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories ?? []}
        onCreated={() => {
          setCreateOpen(false);
          refresh();
          toast.success("Artículo publicado exitosamente");
        }}
      />
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  saved,
  onToggleSave,
  index,
}: {
  product: MarketplaceProduct;
  saved: boolean;
  onToggleSave: () => void;
  index: number;
}) {
  const img = product.images?.[0];
  const cond = CONDITIONS[product.condition];

  return (
    <div
      className={cn(
        "surface group overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-100 dark:bg-gray-800 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag
              size={36}
              className="text-slate-300 dark:text-slate-600"
            />
          </div>
        )}

        {/* Status overlay */}
        {product.status !== "available" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg uppercase tracking-wide">
              {product.status === "sold" ? "Vendido" : "Reservado"}
            </span>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSave();
          }}
          className={cn(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center",
            "transition-all shadow-md",
            saved
              ? "bg-rose-500 text-white"
              : "bg-white/90 dark:bg-gray-900/90 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100",
          )}
          aria-label={saved ? "Quitar de guardados" : "Guardar"}
        >
          <Heart size={15} fill={saved ? "currentColor" : "none"} />
        </button>

        {/* Condition badge */}
        {cond && (
          <div className="absolute bottom-2 left-2">
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                cond.color,
              )}
            >
              {cond.label}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <Link href={`/marketplace/${product.id}`} className="block p-3">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 line-clamp-2 leading-snug">
          {product.title}
        </h3>

        <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1.5">
          ${product.price.toLocaleString()}
          <span className="text-xs font-normal text-slate-400 ml-1">
            {product.currency}
          </span>
        </p>

        {/* Rating */}
        {product.rating && product.reviews_count && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {product.rating.toFixed(1)} ({product.reviews_count})
            </span>
          </div>
        )}

        {/* Location */}
        {product.location && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 truncate">
            <MapPin size={10} />
            {product.location}
          </p>
        )}
      </Link>
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
      <Tag size={11} />
      {label}
      <button
        onClick={onRemove}
        className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors ml-0.5"
      >
        <X size={12} />
      </button>
    </span>
  );
}

// ─── Filters modal ────────────────────────────────────────────────────────────

function FiltersModal({
  open,
  onClose,
  filters,
  categories,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  categories: MarketplaceCategory[];
  onApply: (f: Partial<Filters>) => void;
}) {
  const [local, setLocal] = useState<Partial<Filters>>({
    category_id: filters.category_id,
    condition: filters.condition,
    min_price: filters.min_price,
    max_price: filters.max_price,
  });

  const [minStr, setMinStr] = useState(filters.min_price?.toString() ?? "");
  const [maxStr, setMaxStr] = useState(filters.max_price?.toString() ?? "");

  const handleApply = () => {
    const min = minStr ? parseFloat(minStr) : undefined;
    const max = maxStr ? parseFloat(maxStr) : undefined;
    onApply({ ...local, min_price: min, max_price: max });
  };

  const handleClear = () => {
    setLocal({});
    setMinStr("");
    setMaxStr("");
    onApply({});
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filtrar productos"
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClear}
            leftIcon={<X size={15} />}
          >
            Limpiar
          </Button>
          <Button onClick={handleApply} leftIcon={<Check size={15} />}>
            Aplicar filtros
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Category */}
        {categories.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Categoría
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setLocal((prev) => ({
                      ...prev,
                      category_id:
                        prev.category_id === cat.id ? undefined : cat.id,
                    }))
                  }
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all",
                    local.category_id === cat.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700",
                  )}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span className="truncate">{cat.name}</span>
                  {local.category_id === cat.id && (
                    <Check
                      size={14}
                      className="ml-auto shrink-0 text-indigo-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Condition */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Condición
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(CONDITIONS) as [ProductCondition, { label: string; color: string }][])
              .map(([value, { label, color }]) => (
              <button
                key={value}
                onClick={() =>
                  setLocal((prev) => ({
                    ...prev,
                    condition: prev.condition === value ? undefined : value,
                  }))
                }
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all",
                  local.condition === value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700",
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    color.split(" ")[0],
                  )}
                />
                {label}
                {local.condition === value && (
                  <Check
                    size={14}
                    className="ml-auto shrink-0 text-indigo-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Rango de precio
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">
                Mínimo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minStr}
                  onChange={(e) => setMinStr(e.target.value)}
                  className="input-base pl-7"
                />
              </div>
            </div>
            <span className="text-slate-400 mt-5">—</span>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">
                Máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={maxStr}
                  onChange={(e) => setMaxStr(e.target.value)}
                  className="input-base pl-7"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Create listing modal ─────────────────────────────────────────────────────

function CreateListingModal({
  open,
  onClose,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: MarketplaceCategory[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    condition: "new" as ProductCondition,
    category_id: "",
    location: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10);
    setImageFiles((prev) => [...prev, ...arr].slice(0, 10));
    arr.forEach((f) =>
      setImagePreviews((prev) =>
        [...prev, URL.createObjectURL(f)].slice(0, 10),
      ),
    );
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(imagePreviews[i]);
    setImageFiles((prev) => prev.filter((_, j) => j !== i));
    setImagePreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.price || form.description.trim().length < 10)
      return;
    setSaving(true);
    try {
      await marketplaceApi.createProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        condition: form.condition,
        category_id: form.category_id || undefined,
        location: form.location || undefined,
        images: imagePreviews.length > 0 ? imagePreviews : undefined,
      });
      onCreated();
    } catch {
      toast.error("Error al publicar el artículo");
    } finally {
      setSaving(false);
    }
  };

  const isValid =
    form.title.trim() &&
    form.price &&
    parseFloat(form.price) > 0 &&
    form.description.trim().length >= 10;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publicar artículo"
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
            leftIcon={<ShoppingBag size={15} />}
          >
            Publicar artículo
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Images */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
            Fotos del artículo
          </label>
          <div className="grid grid-cols-5 gap-2">
            {imagePreviews.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 group"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            ))}
            {imagePreviews.length < 10 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImages(e.target.files)}
                />
                <Plus
                  size={20}
                  className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                />
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 mt-1 transition-colors">
                  Añadir
                </span>
              </label>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Máximo 10 fotos. La primera foto será la portada.
          </p>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="¿Qué estás vendiendo?"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-slate-400 text-right">
            {form.title.length}/100
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
            placeholder="Describe el artículo: estado, características, motivo de venta..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={2000}
          />
        </div>

        {/* Price + Condition row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Precio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input-base pl-7"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Condición <span className="text-red-500">*</span>
            </label>
            <select
              value={form.condition}
              onChange={(e) => set("condition", e.target.value as ProductCondition)}
              className="input-base cursor-pointer"
            >
              {(Object.entries(CONDITIONS) as [ProductCondition, { label: string; color: string }][])
                .map(([v, { label }]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Categoría
            </label>
            <select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              className="input-base cursor-pointer"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ubicación
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Ciudad, estado..."
                className="input-base pl-9"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
          <Truck size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            Tu artículo será visible para todos los usuarios de la plataforma.
            Asegúrate de que la información sea precisa.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
    </div>
  );
}

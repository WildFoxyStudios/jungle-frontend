"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Wifi,
  Building,
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  Star,
  Users,
  Plus,
  Filter,
  X,
  CheckCircle,
  Send,
  FileText,
} from "lucide-react";
import { jobsApi } from "@/lib/api-jobs";
import { useInfiniteApi, useApi, useMutation } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { JobPosting } from "@/lib/types";

// ─── Employment type labels ───────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
  { value: "", label: "Todos los tipos" },
  { value: "full_time", label: "Tiempo completo" },
  { value: "part_time", label: "Medio tiempo" },
  { value: "contract", label: "Contrato" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Prácticas" },
  { value: "temporary", label: "Temporal" },
];

const EXPERIENCE_LEVELS = [
  { value: "", label: "Cualquier nivel" },
  { value: "entry", label: "Sin experiencia" },
  { value: "junior", label: "Junior (1-2 años)" },
  { value: "mid", label: "Intermedio (3-5 años)" },
  { value: "senior", label: "Senior (5+ años)" },
  { value: "lead", label: "Líder / Manager" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [isRemote, setIsRemote] = useState<boolean | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applyModal, setApplyModal] = useState<JobPosting | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const debouncedLocation = useDebounce(location, 350);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Briefcase size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              Empleos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              Encuentra tu próxima oportunidad profesional
            </p>
          </div>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          <span className="hidden sm:inline">Publicar empleo</span>
          <span className="sm:hidden">Publicar</span>
        </Button>
      </div>

      <Tabs defaultTab="search">
        <div className="surface mb-4">
          <TabList className="px-2">
            <Tab value="search">Buscar empleos</Tab>
            <Tab value="recommended">Recomendados</Tab>
            <Tab value="saved">Guardados</Tab>
            <Tab value="applications">Mis aplicaciones</Tab>
            <Tab value="my-jobs">Mis publicaciones</Tab>
          </TabList>
        </div>

        <TabPanel value="search">
          <SearchTab
            search={debouncedSearch}
            location={debouncedLocation}
            employmentType={employmentType}
            isRemote={isRemote}
            onSearchChange={setSearch}
            onLocationChange={setLocation}
            onFiltersOpen={() => setFiltersOpen(true)}
            onApply={setApplyModal}
          />
        </TabPanel>
        <TabPanel value="recommended">
          <RecommendedTab onApply={setApplyModal} />
        </TabPanel>
        <TabPanel value="saved">
          <SavedJobsTab onApply={setApplyModal} />
        </TabPanel>
        <TabPanel value="applications">
          <ApplicationsTab />
        </TabPanel>
        <TabPanel value="my-jobs">
          <MyJobsTab />
        </TabPanel>
      </Tabs>

      {/* Filters modal */}
      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        employmentType={employmentType}
        isRemote={isRemote}
        onApply={(et, remote) => {
          setEmploymentType(et);
          setIsRemote(remote);
          setFiltersOpen(false);
        }}
      />

      {/* Apply modal */}
      {applyModal && (
        <ApplyModal job={applyModal} onClose={() => setApplyModal(null)} />
      )}

      {/* Create job modal */}
      <CreateJobModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          // Refresh all job tabs that might be affected
          window.dispatchEvent(new CustomEvent("refresh-jobs"));
        }}
      />
    </div>
  );
}

// ─── Search tab ───────────────────────────────────────────────────────────────

function SearchTab({
  search,
  location,
  employmentType,
  isRemote,
  onSearchChange,
  onLocationChange,
  onFiltersOpen,
  onApply,
}: {
  search: string;
  location: string;
  employmentType: string;
  isRemote?: boolean;
  onSearchChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onFiltersOpen: () => void;
  onApply: (job: JobPosting) => void;
}) {
  const {
    items: jobs,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) =>
      jobsApi.search({
        keywords: search || undefined,
        location: location || undefined,
        employment_type: employmentType || undefined,
        is_remote: isRemote,
        limit,
        offset,
      }),
    [search, location, employmentType, isRemote],
    15,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const activeFilters = [employmentType, isRemote !== undefined].filter(
    Boolean,
  ).length;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Título, empresa, habilidades..."
            defaultValue={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-base pl-10"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-[240px]">
            <MapPin
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Ciudad, país..."
              defaultValue={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <button
            onClick={onFiltersOpen}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all shrink-0",
              activeFilters > 0
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300",
            )}
          >
            <Filter size={16} />
            Filtros
            {activeFilters > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Results count */}
      {!loading && jobs.length > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {jobs.length} empleo{jobs.length !== 1 ? "s" : ""} encontrado
          {jobs.length !== 1 ? "s" : ""}
          {search && (
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {" "}
              para "{search}"
            </span>
          )}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && jobs.length === 0 && (
        <EmptyState
          icon={<Briefcase size={32} />}
          title="Sin empleos disponibles"
          description={
            search || location
              ? "No encontramos empleos con esos criterios. Intenta ampliar tu búsqueda."
              : "No hay empleos publicados por el momento."
          }
          className="py-16"
        />
      )}

      {/* Job cards */}
      {!loading && (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} onApply={onApply} />
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {!hasMore && jobs.length > 0 && (
        <p className="text-center text-sm text-slate-400 py-4">
          Has visto todas las ofertas de empleo
        </p>
      )}
    </div>
  );
}

// ─── Recommended tab ──────────────────────────────────────────────────────────

function RecommendedTab({ onApply }: { onApply: (job: JobPosting) => void }) {
  const { data: jobs, loading } = useApi(() => jobsApi.getRecommended(), []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={<Star size={32} />}
        title="Sin recomendaciones aún"
        description="Completa tu perfil con tu ubicación y experiencia para recibir empleos recomendados."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Empleos que podrían interesarte según tu perfil
      </p>
      {jobs.map((job, i) => (
        <JobCard key={job.id} job={job} index={i} onApply={onApply} />
      ))}
    </div>
  );
}

// ─── Saved jobs tab ───────────────────────────────────────────────────────────

function SavedJobsTab({ onApply }: { onApply: (job: JobPosting) => void }) {
  const { data: jobs, loading } = useApi(() => jobsApi.getSaved(), []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={<BookmarkCheck size={32} />}
        title="Sin empleos guardados"
        description="Guarda empleos que te interesen para consultarlos más tarde."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <JobCard key={job.id} job={job} index={i} onApply={onApply} saved />
      ))}
    </div>
  );
}

// ─── Applications tab ─────────────────────────────────────────────────────────

function ApplicationsTab() {
  const { data: applications, loading } = useApi(
    () => jobsApi.getMyApplications(),
    [],
  );

  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "primary" | "success" | "warning" | "danger";
    }
  > = {
    pending: { label: "Pendiente", variant: "default" },
    reviewed: { label: "Revisada", variant: "primary" },
    shortlisted: { label: "Preseleccionado", variant: "warning" },
    rejected: { label: "Rechazada", variant: "danger" },
    hired: { label: "¡Contratado!", variant: "success" },
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface p-4 flex gap-3">
            <Skeleton className="w-12 h-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={32} />}
        title="Sin aplicaciones"
        description="No has aplicado a ningún empleo todavía. ¡Empieza a buscar oportunidades!"
        action={<Button variant="secondary">Buscar empleos</Button>}
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
        {applications.length} aplicación{applications.length !== 1 ? "es" : ""}
      </p>
      {applications.map((app, i) => {
        const cfg = statusConfig[app.status] ?? statusConfig.pending;
        return (
          <div
            key={app.id}
            className={cn(
              "surface p-4 flex items-start gap-4 animate-fade-in-up",
              `stagger-${(i % 5) + 1}`,
            )}
          >
            {/* Company icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shrink-0">
              <Building
                size={22}
                className="text-slate-400 dark:text-slate-500"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                {app.job_title ?? `Empleo #${app.job_id.slice(0, 8)}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {app.job_city && `${app.job_city}${app.job_country ? `, ${app.job_country}` : ""} · `}
                Aplicado{" "}
                {formatDistanceToNow(new Date(app.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
              {app.cover_letter && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 italic">
                  "{app.cover_letter.slice(0, 80)}..."
                </p>
              )}
            </div>

            {/* Status */}
            <Badge variant={cfg.variant} size="md">
              {app.status === "hired" && "🎉 "}
              {cfg.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// ─── My jobs tab ──────────────────────────────────────────────────────────────

function MyJobsTab() {
  const toast = useToast();
  const { data: jobs, loading, refresh } = useApi(() => jobsApi.getMy(), []);
  const { execute: closeJob } = useMutation((id: string) => jobsApi.close(id));
  const { execute: deleteJob } = useMutation((id: string) =>
    jobsApi.delete(id),
  );

  // Listen for refresh event from CreateJobModal
  useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener("refresh-jobs", handleRefresh);
    return () => window.removeEventListener("refresh-jobs", handleRefresh);
  }, [refresh]);

  const handleClose = async (id: string, title: string) => {
    if (!confirm(`¿Cerrar la oferta "${title}"?`)) return;
    await closeJob(id);
    refresh();
    toast.success("Oferta cerrada");
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `¿Eliminar la oferta "${title}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await deleteJob(id);
    refresh();
    toast.success("Oferta eliminada");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase size={32} />}
        title="No has publicado empleos"
        description="Crea tu primera oferta de trabajo para encontrar al candidato ideal."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <div
          key={job.id}
          className={cn(
            "surface p-4 animate-fade-in-up",
            `stagger-${(i % 5) + 1}`,
          )}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center shrink-0">
              <Building
                size={22}
                className="text-indigo-500 dark:text-indigo-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50">
                    {job.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {job.city && `${job.city}, `}
                    {job.country}
                    {job.is_remote && " · Remoto"}
                  </p>
                </div>
                <Badge
                  variant={
                    job.status === "active"
                      ? "success"
                      : job.status === "closed"
                        ? "default"
                        : "danger"
                  }
                  dot
                >
                  {job.status === "active"
                    ? "Activo"
                    : job.status === "closed"
                      ? "Cerrado"
                      : "Eliminado"}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {job.applications_count ?? 0} aplicaciones
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  {formatDistanceToNow(new Date(job.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Link href={`/jobs/${job.id}/applicants`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Users size={13} />}
                  >
                    Ver aplicantes
                  </Button>
                </Link>
                {job.status === "active" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleClose(job.id, job.title)}
                    className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    Cerrar oferta
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(job.id, job.title)}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  index,
  onApply,
  saved: initialSaved,
}: {
  job: JobPosting;
  index: number;
  onApply: (job: JobPosting) => void;
  saved?: boolean;
}) {
  const toast = useToast();
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [expanded, setExpanded] = useState(false);
  const { execute: saveJob } = useMutation(() => jobsApi.save(job.id));
  const { execute: unsaveJob } = useMutation(() => jobsApi.unsave(job.id));

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        await unsaveJob();
        toast.info("Empleo eliminado de guardados");
      } else {
        await saveJob();
        toast.success("Empleo guardado");
      }
    } catch {
      setSaved(wasSaved);
      toast.error("Error al guardar");
    }
  };

  const salaryText =
    job.show_salary && (job.salary_min || job.salary_max)
      ? job.salary_min && job.salary_max
        ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
        : job.salary_min
          ? `Desde $${job.salary_min.toLocaleString()}`
          : `Hasta $${job.salary_max?.toLocaleString()}`
      : null;

  return (
    <div
      className={cn(
        "surface p-4 hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
        expanded && "ring-2 ring-indigo-200 dark:ring-indigo-800",
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-4">
        {/* Company logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shrink-0 shadow-sm">
          <Building size={24} className="text-slate-400 dark:text-slate-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                {job.city && `${job.city}`}
                {job.country && `, ${job.country}`}
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleToggleSave}
              className={cn(
                "p-2 rounded-xl transition-colors shrink-0",
                saved
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
              )}
              title={saved ? "Quitar de guardados" : "Guardar empleo"}
            >
              {saved ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
            </button>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {job.employment_type && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                <Clock size={11} />
                {EMPLOYMENT_TYPES.find((t) => t.value === job.employment_type)
                  ?.label ?? job.employment_type}
              </span>
            )}
            {job.is_remote && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                <Wifi size={11} />
                Remoto
              </span>
            )}
            {job.experience_level && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                <Star size={11} />
                {EXPERIENCE_LEVELS.find((l) => l.value === job.experience_level)
                  ?.label ?? job.experience_level}
              </span>
            )}
            {salaryText && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                <DollarSign size={11} />
                {salaryText}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Users size={11} />
              {job.applications_count ?? 0} aplicaciones
            </span>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(job.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {job.views_count > 0 && (
              <>
                <span>·</span>
                <span>{job.views_count} vistas</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-4">
          {/* Description */}
          {job.description && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Descripción del puesto
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {job.description.length > 400
                  ? job.description.slice(0, 400) + "..."
                  : job.description}
              </p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {job.city && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin size={15} className="text-slate-400 shrink-0" />
                <span>
                  {job.city}
                  {job.country && `, ${job.country}`}
                </span>
              </div>
            )}
            {job.is_remote && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Wifi size={15} className="text-green-500 shrink-0" />
                <span>Posición remota</span>
              </div>
            )}
          </div>

          {/* Apply button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              leftIcon={<Send size={15} />}
              onClick={(e) => {
                e.stopPropagation();
                onApply(job);
              }}
              className="flex-1"
            >
              Aplicar ahora
            </Button>
            <Button
              variant="secondary"
              leftIcon={
                saved ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />
              }
              onClick={handleToggleSave}
            >
              {saved ? "Guardado" : "Guardar"}
            </Button>
          </div>
        </div>
      )}

      {/* Expand hint */}
      {!expanded && (
        <div className="flex items-center justify-end mt-2">
          <span className="text-xs text-slate-400 flex items-center gap-0.5">
            Ver detalles <ChevronDown size={13} />
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Apply modal ──────────────────────────────────────────────────────────────

function ApplyModal({
  job,
  onClose,
}: {
  job: JobPosting;
  onClose: () => void;
}) {
  const toast = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleApply = async () => {
    setSaving(true);
    try {
      await jobsApi.apply(job.id, {
        cover_letter: coverLetter || undefined,
        resume_url: resumeUrl || undefined,
      });
      setSubmitted(true);
    } catch {
      toast.error("Error al enviar la aplicación. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={submitted ? "¡Aplicación enviada!" : `Aplicar a: ${job.title}`}
      size="md"
      footer={
        submitted ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              loading={saving}
              leftIcon={<Send size={15} />}
            >
              Enviar aplicación
            </Button>
          </>
        )
      }
    >
      {submitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
            <CheckCircle
              size={32}
              className="text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              ¡Aplicación enviada con éxito!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              El reclutador revisará tu perfil y se pondrá en contacto contigo.
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl text-left space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {job.title}
            </p>
            <p className="text-xs text-slate-500">
              {job.city}
              {job.country && `, ${job.country}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Job preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shrink-0">
              <Building
                size={18}
                className="text-slate-500 dark:text-slate-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {job.title}
              </p>
              <p className="text-xs text-slate-500">
                {job.city}
                {job.country && `, ${job.country}`}{" "}
                {job.is_remote && "· Remoto"}
              </p>
            </div>
          </div>

          {/* Cover letter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Carta de presentación
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="¿Por qué eres el candidato ideal para este puesto? Cuéntanos sobre tu experiencia y motivación..."
              className="input-base resize-none"
              rows={5}
              maxLength={2000}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Opcional, pero recomendada
              </p>
              <p className="text-xs text-slate-400">
                {coverLetter.length}/2000
              </p>
            </div>
          </div>

          {/* Resume URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Enlace a tu currículum / portfolio
            </label>
            <input
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://linkedin.com/in/tuperfil o https://miresumecdn.com/cv.pdf"
              className="input-base"
            />
            <p className="text-xs text-slate-400">
              Puedes enlazar tu perfil de LinkedIn, GitHub, Behance, o un PDF de
              tu CV
            </p>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <Briefcase size={16} className="text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              Al aplicar, el reclutador podrá ver tu perfil público. Asegúrate
              de que tu información esté actualizada.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Filters modal ────────────────────────────────────────────────────────────

function FiltersModal({
  open,
  onClose,
  employmentType,
  isRemote,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  employmentType: string;
  isRemote?: boolean;
  onApply: (employmentType: string, isRemote?: boolean) => void;
}) {
  const [localType, setLocalType] = useState(employmentType);
  const [localRemote, setLocalRemote] = useState(isRemote);

  const handleApply = () => onApply(localType, localRemote);
  const handleClear = () => {
    setLocalType("");
    setLocalRemote(undefined);
    onApply("", undefined);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filtrar empleos"
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClear}
            leftIcon={<X size={15} />}
          >
            Limpiar
          </Button>
          <Button onClick={handleApply}>Aplicar filtros</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Employment type */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Tipo de empleo
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {EMPLOYMENT_TYPES.filter((t) => t.value !== "").map((type) => (
              <button
                key={type.value}
                onClick={() =>
                  setLocalType((t) => (t === type.value ? "" : type.value))
                }
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all",
                  localType === type.value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300",
                )}
              >
                {localType === type.value && (
                  <CheckCircle size={13} className="text-indigo-500 shrink-0" />
                )}
                <span className="truncate">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Remote */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Modalidad
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: undefined, label: "Todos" },
              { value: true, label: "Remoto" },
              { value: false, label: "Presencial" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => setLocalRemote(opt.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-center transition-all",
                  localRemote === opt.value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Create job modal ─────────────────────────────────────────────────────────

function CreateJobModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    country: "",
    employment_type: "full_time",
    experience_level: "",
    is_remote: false,
    salary_min: "",
    salary_max: "",
    show_salary: true,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await jobsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        city: form.city || undefined,
        country: form.country || undefined,
        employment_type: form.employment_type || undefined,
        experience_level: form.experience_level || undefined,
        is_remote: form.is_remote,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : undefined,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : undefined,
        show_salary: form.show_salary,
      });
      toast.success("Oferta publicada exitosamente");
      onCreated?.();
      onClose();
    } catch {
      toast.error("Error al publicar la oferta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publicar oferta de empleo"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            disabled={!form.title.trim() || !form.description.trim()}
          >
            Publicar oferta
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Título del puesto <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Ej: Desarrollador Full Stack, Diseñador UX/UI..."
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={120}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción del puesto <span className="text-red-500">*</span>
          </label>
          <textarea
            className="input-base resize-none"
            rows={5}
            placeholder="Describe las responsabilidades, requisitos y beneficios del puesto..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={5000}
          />
        </div>

        {/* Location row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ciudad
            </label>
            <input
              className="input-base"
              placeholder="Ciudad de México"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              País
            </label>
            <input
              className="input-base"
              placeholder="México"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </div>
        </div>

        {/* Type + Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo de empleo
            </label>
            <select
              className="input-base cursor-pointer"
              value={form.employment_type}
              onChange={(e) => set("employment_type", e.target.value)}
            >
              {EMPLOYMENT_TYPES.filter((t) => t.value !== "").map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nivel de experiencia
            </label>
            <select
              className="input-base cursor-pointer"
              value={form.experience_level}
              onChange={(e) => set("experience_level", e.target.value)}
            >
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Rango salarial (opcional)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_salary}
                onChange={(e) => set("show_salary", e.target.checked)}
                className="rounded"
              />
              Mostrar salario
            </label>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                $
              </span>
              <input
                type="number"
                placeholder="Mínimo"
                className="input-base pl-7"
                value={form.salary_min}
                onChange={(e) => set("salary_min", e.target.value)}
              />
            </div>
            <span className="text-slate-400">—</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                $
              </span>
              <input
                type="number"
                placeholder="Máximo"
                className="input-base pl-7"
                value={form.salary_max}
                onChange={(e) => set("salary_max", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Remote toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Wifi size={18} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Puesto remoto
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                El candidato puede trabajar desde cualquier lugar
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={form.is_remote}
            onClick={() => set("is_remote", !form.is_remote)}
            className={cn(
              "relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0",
              form.is_remote
                ? "bg-indigo-600"
                : "bg-slate-200 dark:bg-slate-700",
            )}
          >
            <span
              className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
              style={{
                transform: form.is_remote
                  ? "translateX(20px)"
                  : "translateX(2px)",
              }}
            />
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="surface p-4 flex gap-4">
      <Skeleton className="w-14 h-14 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-2.5 w-40 mt-1" />
      </div>
      <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
    </div>
  );
}

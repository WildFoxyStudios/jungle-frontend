"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Globe,
  Lock,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Video,
  Check,
  Star,
  X,
} from "lucide-react";
import { eventsApi } from "@/lib/api-events";
import { useApi, useMutation, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Event } from "@/lib/types";

// ─── RSVP labels ─────────────────────────────────────────────────────────────

const RSVP_CONFIG = {
  going: {
    label: "Asistiré",
    icon: <Check size={14} />,
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    active: "bg-green-600 text-white",
  },
  interested: {
    label: "Interesado",
    icon: <Star size={14} />,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    active: "bg-amber-500 text-white",
  },
  not_going: {
    label: "No asistiré",
    icon: <X size={14} />,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    active: "bg-slate-600 text-white",
  },
} as const;

type RsvpStatus = keyof typeof RSVP_CONFIG;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: upcoming,
    loading: loadingUpcoming,
    refresh: refreshUpcoming,
  } = useApi(() => eventsApi.getUpcoming(), []);

  const {
    data: myEvents,
    loading: loadingMy,
    refresh: refreshMy,
  } = useApi(() => eventsApi.getMy(), []);

  const {
    items: allEvents,
    loading: loadingAll,
    loadingMore,
    hasMore,
    loadMore,
    refresh: refreshAll,
  } = useInfiniteApi(
    (offset, limit) => eventsApi.list({ limit, offset }),
    [],
    12,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const filteredAll = search
    ? allEvents.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location?.toLowerCase().includes(search.toLowerCase()),
      )
    : allEvents;

  const handleCreated = () => {
    setCreateOpen(false);
    refreshAll();
    refreshUpcoming();
    refreshMy();
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
            Eventos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Descubre y crea eventos cerca de ti
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Crear evento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="discover">
        <div className="surface mb-4">
          <TabList className="px-2">
            <Tab value="discover">Descubrir</Tab>
            <Tab value="upcoming">Próximos</Tab>
            <Tab value="mine">Mis eventos</Tab>
            <Tab value="calendar">Calendario</Tab>
          </TabList>
        </div>

        {/* Discover */}
        <TabPanel value="discover">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                placeholder="Buscar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10"
              />
            </div>

            {loadingAll && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loadingAll && filteredAll.length === 0 && (
              <EmptyState
                icon={<Calendar size={32} />}
                title="Sin eventos"
                description={
                  search
                    ? `No encontramos eventos que coincidan con "${search}".`
                    : "No hay eventos disponibles por el momento."
                }
                action={
                  <Button
                    leftIcon={<Plus size={15} />}
                    onClick={() => setCreateOpen(true)}
                  >
                    Crear evento
                  </Button>
                }
                className="py-16"
              />
            )}

            {!loadingAll && filteredAll.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAll.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    onRsvpChange={refreshAll}
                  />
                ))}
              </div>
            )}

            {loadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />

            {!hasMore && filteredAll.length > 0 && (
              <p className="text-center text-sm text-slate-400 py-4">
                Has visto todos los eventos disponibles
              </p>
            )}
          </div>
        </TabPanel>

        {/* Upcoming */}
        <TabPanel value="upcoming">
          {loadingUpcoming && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventListSkeleton key={i} />
              ))}
            </div>
          )}
          {!loadingUpcoming && (!upcoming || upcoming.length === 0) && (
            <EmptyState
              icon={<Clock size={32} />}
              title="Sin eventos próximos"
              description="Los eventos a los que respondas 'Asistiré' o 'Interesado' aparecerán aquí."
              action={
                <Button variant="secondary" onClick={() => {}}>
                  Explorar eventos
                </Button>
              }
              className="py-16"
            />
          )}
          {!loadingUpcoming && upcoming && upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {upcoming.length} evento{upcoming.length !== 1 ? "s" : ""}{" "}
                próximo{upcoming.length !== 1 ? "s" : ""}
              </p>
              {upcoming.map((event, i) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  index={i}
                  onRsvpChange={refreshUpcoming}
                />
              ))}
            </div>
          )}
        </TabPanel>

        {/* My events */}
        <TabPanel value="mine">
          {loadingMy && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}
          {!loadingMy && (!myEvents || myEvents.length === 0) && (
            <EmptyState
              icon={<Calendar size={32} />}
              title="No has creado ningún evento"
              description="Organiza un evento y conecta con personas que comparten tus intereses."
              action={
                <Button
                  leftIcon={<Plus size={15} />}
                  onClick={() => setCreateOpen(true)}
                >
                  Crear mi primer evento
                </Button>
              }
              className="py-16"
            />
          )}
          {!loadingMy && myEvents && myEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myEvents.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  onRsvpChange={refreshMy}
                  showManage
                />
              ))}
            </div>
          )}
        </TabPanel>

        {/* Calendar */}
        <TabPanel value="calendar">
          <EventCalendar events={allEvents} />
        </TabPanel>
      </Tabs>

      {/* Create event modal */}
      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

// ─── Event card (grid view) ───────────────────────────────────────────────────

function EventCard({
  event,
  index,
  onRsvpChange,
  showManage,
}: {
  event: Event;
  index: number;
  onRsvpChange?: () => void;
  showManage?: boolean;
}) {
  const toast = useToast();
  const [rsvp, setRsvp] = useState<RsvpStatus | null>(
    (event.user_rsvp as RsvpStatus) ?? null,
  );
  const [loading, setLoading] = useState(false);

  const startDate = new Date(event.start_time);

  const handleRsvp = async (status: RsvpStatus) => {
    const prev = rsvp;
    setRsvp(status);
    setLoading(true);
    try {
      await eventsApi.rsvp(event.id, status);
      toast.success(RSVP_CONFIG[status].label);
      onRsvpChange?.();
    } catch {
      setRsvp(prev);
      toast.error("Error al actualizar tu respuesta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "surface flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-400 overflow-hidden">
        {event.cover_url ? (
          <img
            src={event.cover_url}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={48} className="text-white/30" />
          </div>
        )}

        {/* Date badge */}
        <div className="absolute top-3 left-3 w-12 text-center bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-indigo-600 py-0.5">
            <p className="text-[10px] font-bold text-white uppercase leading-none">
              {format(startDate, "MMM", { locale: es })}
            </p>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-slate-50 py-0.5 leading-none">
            {format(startDate, "d")}
          </p>
        </div>

        {/* Online badge */}
        {event.is_online && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium rounded-full">
            <Video size={11} />
            En línea
          </span>
        )}

        {/* Privacy badge */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium rounded-full">
          {event.event_type === "public" ? (
            <Globe size={11} />
          ) : (
            <Lock size={11} />
          )}
          {event.event_type === "public" ? "Público" : "Privado"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        <Link href={`/events/${event.id}`}>
          <h3 className="font-bold text-slate-900 dark:text-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
            {event.name}
          </h3>
        </Link>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0 text-indigo-400" />
            <span>
              {format(startDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0 text-red-400" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users size={13} className="shrink-0 text-green-400" />
            <span>
              {event.going_count} asistiré
              {event.interested_count > 0 &&
                ` · ${event.interested_count} interesados`}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        {event.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
            {event.description}
          </p>
        )}

        {/* RSVP buttons */}
        <div className="mt-auto pt-2 flex gap-2">
          {showManage ? (
            <Link href={`/events/${event.id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                Administrar
              </Button>
            </Link>
          ) : (
            <>
              <Button
                size="sm"
                className={cn(
                  "flex-1 transition-all",
                  rsvp === "going"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "",
                )}
                variant={rsvp === "going" ? "primary" : "secondary"}
                leftIcon={<Check size={14} />}
                onClick={() => handleRsvp("going")}
                loading={loading && rsvp === "going"}
              >
                {rsvp === "going" ? "Asistiré ✓" : "Asistiré"}
              </Button>
              <Button
                size="sm"
                variant={rsvp === "interested" ? "primary" : "ghost"}
                className={cn(
                  rsvp === "interested"
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "",
                )}
                leftIcon={<Star size={14} />}
                onClick={() => handleRsvp("interested")}
              >
                Interesado
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Event list item (upcoming tab) ──────────────────────────────────────────

function EventListItem({
  event,
  index,
  onRsvpChange,
}: {
  event: Event;
  index: number;
  onRsvpChange?: () => void;
}) {
  const toast = useToast();
  const [rsvp, setRsvp] = useState<RsvpStatus | null>(
    (event.user_rsvp as RsvpStatus) ?? null,
  );
  const startDate = new Date(event.start_time);

  const handleRsvp = async (status: RsvpStatus) => {
    const prev = rsvp;
    setRsvp(status);
    try {
      await eventsApi.rsvp(event.id, status);
      toast.success(RSVP_CONFIG[status].label);
      onRsvpChange?.();
    } catch {
      setRsvp(prev);
      toast.error("Error al actualizar tu respuesta");
    }
  };

  return (
    <div
      className={cn(
        "surface flex gap-4 p-4 hover:shadow-md transition-all animate-fade-in-up",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Date widget */}
      <div className="w-14 shrink-0 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl overflow-hidden self-start">
        <div className="bg-indigo-600 py-1">
          <p className="text-[10px] font-bold text-white uppercase leading-none">
            {format(startDate, "MMM", { locale: es })}
          </p>
        </div>
        <div className="py-2">
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 leading-none">
            {format(startDate, "d")}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {format(startDate, "EEE", { locale: es })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/events/${event.id}`}>
              <h3 className="font-bold text-slate-900 dark:text-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                {event.name}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock size={12} className="text-indigo-400" />
                {format(startDate, "HH:mm")}
                {event.end_time &&
                  ` – ${format(new Date(event.end_time), "HH:mm")}`}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin size={12} className="text-red-400" />
                  <span className="truncate max-w-[180px]">
                    {event.location}
                  </span>
                </span>
              )}
              {event.is_online && (
                <Badge variant="primary" size="sm">
                  <Video size={10} className="mr-0.5" />
                  En línea
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <Users size={12} />
              <span>
                {event.going_count} asistiré
                {event.interested_count > 0 &&
                  ` · ${event.interested_count} interesados`}
              </span>
            </div>
          </div>
        </div>

        {/* RSVP row */}
        <div className="flex items-center gap-2 mt-3">
          {(["going", "interested", "not_going"] as RsvpStatus[]).map(
            (status) => {
              const cfg = RSVP_CONFIG[status];
              const isActive = rsvp === status;
              return (
                <button
                  key={status}
                  onClick={() => handleRsvp(status)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    isActive ? cfg.active : cfg.color,
                    !isActive && "hover:opacity-80",
                  )}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Cover thumbnail */}
      {event.cover_url && (
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 shrink-0 self-start hidden sm:block">
          <img
            src={event.cover_url}
            alt={event.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

// ─── Mini calendar view ───────────────────────────────────────────────────────

function EventCalendar({ events }: { events: Event[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { locale: es });
  const calEnd = endOfWeek(monthEnd, { locale: es });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.start_time), day));

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar grid */}
      <div className="lg:col-span-2 surface p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dayEvents = eventsOnDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay
              ? isSameDay(day, selectedDay)
              : false;
            const isTodayDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() =>
                  setSelectedDay(
                    isSameDay(day, selectedDay ?? new Date(-1)) ? null : day,
                  )
                }
                className={cn(
                  "relative flex flex-col items-center p-1.5 rounded-xl text-sm transition-all min-h-[52px]",
                  !isCurrentMonth && "opacity-30",
                  isSelected &&
                    "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50",
                  !isSelected &&
                    isTodayDay &&
                    "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
                  !isSelected &&
                    !isTodayDay &&
                    "hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300",
                )}
              >
                <span
                  className={cn(
                    "font-semibold text-xs leading-none",
                    isTodayDay && !isSelected && "font-black",
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected
                            ? "bg-white/80"
                            : "bg-indigo-500 dark:bg-indigo-400",
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span
                        className={cn(
                          "text-[9px] font-bold",
                          isSelected
                            ? "text-white/80"
                            : "text-indigo-500 dark:text-indigo-400",
                        )}
                      >
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div className="space-y-3">
        <div className="surface p-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">
            {selectedDay
              ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es })
              : "Selecciona un día"}
          </h3>

          {selectedDay && selectedDayEvents.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              Sin eventos este día
            </p>
          )}

          {!selectedDay && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              Haz clic en un día para ver sus eventos
            </p>
          )}

          <div className="space-y-2">
            {selectedDayEvents.map((event) => {
              const startDate = new Date(event.start_time);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-1 h-10 rounded-full bg-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {event.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(startDate, "HH:mm")}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* This month summary */}
        <div className="surface p-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-sm">
            Este mes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {
                  events.filter((e) =>
                    isSameMonth(new Date(e.start_time), currentMonth),
                  ).length
                }
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Eventos</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-2xl font-black text-green-600 dark:text-green-400">
                {
                  events.filter(
                    (e) =>
                      isSameMonth(new Date(e.start_time), currentMonth) &&
                      e.user_rsvp === "going",
                  ).length
                }
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Asistiré</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create event modal ───────────────────────────────────────────────────────

function CreateEventModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_type: "public" as "public" | "private" | "friends",
    location: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    is_online: false,
    online_link: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid = form.name.trim() && form.start_date && form.start_time;

  const handleCreate = async () => {
    if (!isValid) return;
    setSaving(true);

    const startISO = new Date(
      `${form.start_date}T${form.start_time}`,
    ).toISOString();
    const endISO =
      form.end_date && form.end_time
        ? new Date(`${form.end_date}T${form.end_time}`).toISOString()
        : undefined;

    try {
      await eventsApi.create({
        name: form.name.trim(),
        description: form.description || undefined,
        event_type: form.event_type,
        location: form.location || undefined,
        start_time: startISO,
        end_time: endISO,
        is_online: form.is_online,
        online_link: form.online_link || undefined,
      });
      toast.success(`Evento "${form.name}" creado`);
      onCreated();
    } catch {
      toast.error("Error al crear el evento");
    } finally {
      setSaving(false);
    }
  };

  const PRIVACY_OPTIONS = [
    {
      value: "public" as const,
      label: "Público",
      icon: <Globe size={16} />,
      desc: "Cualquiera puede ver y unirse",
    },
    {
      value: "friends" as const,
      label: "Amigos",
      icon: <Users size={16} />,
      desc: "Solo tus amigos",
    },
    {
      value: "private" as const,
      label: "Privado",
      icon: <Lock size={16} />,
      desc: "Solo invitados",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear evento"
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
            leftIcon={<Calendar size={15} />}
          >
            Crear evento
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre del evento <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="¿Cuál es el nombre de tu evento?"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={120}
            autoFocus
          />
        </div>

        {/* Date & Time row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Fecha inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="input-base"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hora inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              className="input-base"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Fecha fin
            </label>
            <input
              type="date"
              className="input-base"
              value={form.end_date}
              onChange={(e) => set("end_date", e.target.value)}
              min={form.start_date}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hora fin
            </label>
            <input
              type="time"
              className="input-base"
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </div>
        </div>

        {/* Online toggle */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-gray-800 rounded-xl">
          <Video size={18} className="text-indigo-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Evento en línea
            </p>
            <p className="text-xs text-slate-500">
              Se realizará por videollamada o streaming
            </p>
          </div>
          <button
            role="switch"
            aria-checked={form.is_online}
            onClick={() => set("is_online", !form.is_online)}
            className={cn(
              "relative inline-flex w-11 h-6 rounded-full transition-colors",
              form.is_online
                ? "bg-indigo-600"
                : "bg-slate-200 dark:bg-slate-700",
            )}
          >
            <span
              className="inline-block w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5"
              style={{
                transform: form.is_online
                  ? "translateX(20px)"
                  : "translateX(2px)",
              }}
            />
          </button>
        </div>

        {/* Location / link */}
        {form.is_online ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Enlace del evento
            </label>
            <input
              type="url"
              className="input-base"
              placeholder="https://meet.google.com/..."
              value={form.online_link}
              onChange={(e) => set("online_link", e.target.value)}
            />
          </div>
        ) : (
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
                className="input-base pl-9"
                placeholder="Ciudad, dirección, lugar..."
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            placeholder="¿De qué trata este evento? Cuéntale a la gente..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={2000}
          />
        </div>

        {/* Privacy */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Privacidad
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PRIVACY_OPTIONS.map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("event_type", value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 text-center transition-all",
                  form.event_type === value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700",
                )}
              >
                <span
                  className={cn(
                    form.event_type === value
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500",
                  )}
                >
                  {icon}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    form.event_type === value
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-200",
                  )}
                >
                  {label}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}

function EventListSkeleton() {
  return (
    <div className="surface p-4 flex gap-4">
      <Skeleton className="w-14 h-16 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

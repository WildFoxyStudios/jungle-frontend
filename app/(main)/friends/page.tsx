"use client";

import { useState } from "react";
import {
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Search,
  ChevronDown,
  Check,
  X,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { friendsApi } from "@/lib/api-friends";
import { useApi, useMutation, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Friend, FriendSuggestion } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { data: stats } = useApi(() => friendsApi.getStats(), []);

  return (
    <div className="max-w-[860px] mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
          Amigos
        </h1>
        {stats && stats.pending_requests > 0 && (
          <Badge variant="danger" size="lg">
            {stats.pending_requests} solicitudes pendientes
          </Badge>
        )}
      </div>

      <Tabs defaultTab="requests">
        <div className="surface mb-4">
          <TabList className="px-2">
            <Tab value="requests" badge={stats?.pending_requests ?? 0}>
              Solicitudes
            </Tab>
            <Tab value="suggestions">Sugerencias</Tab>
            <Tab value="all">Todos los amigos</Tab>
            <Tab value="birthdays">Cumpleaños</Tab>
          </TabList>
        </div>

        <TabPanel value="requests">
          <RequestsTab />
        </TabPanel>
        <TabPanel value="suggestions">
          <SuggestionsTab />
        </TabPanel>
        <TabPanel value="all">
          <AllFriendsTab />
        </TabPanel>
        <TabPanel value="birthdays">
          <BirthdaysTab />
        </TabPanel>
      </Tabs>
    </div>
  );
}

// ─── Requests tab ─────────────────────────────────────────────────────────────

function RequestsTab() {
  const {
    data: requests,
    loading,
    refresh,
  } = useApi(() => friendsApi.getFriendRequests(), []);
  const toast = useToast();
  const [handling, setHandling] = useState<Record<string, boolean>>({});

  const handle = async (friendshipId: string, action: "accept" | "reject") => {
    setHandling((h) => ({ ...h, [friendshipId]: true }));
    try {
      if (action === "accept") {
        await friendsApi.acceptRequest(friendshipId);
        toast.success("Solicitud aceptada");
      } else {
        await friendsApi.rejectRequest(friendshipId);
        toast.info("Solicitud rechazada");
      }
      refresh();
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setHandling((h) => ({ ...h, [friendshipId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <RequestSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus size={32} />}
        title="Sin solicitudes pendientes"
        description="Cuando alguien te envíe una solicitud de amistad aparecerá aquí."
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {requests.length} {requests.length === 1 ? "solicitud" : "solicitudes"}{" "}
        pendiente
        {requests.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requests.map((req) => (
          <FriendRequestCard
            key={req.friendship_id ?? req.id}
            request={req}
            onAccept={() => handle(req.friendship_id ?? req.id, "accept")}
            onReject={() => handle(req.friendship_id ?? req.id, "reject")}
            loading={handling[req.friendship_id ?? req.id] ?? false}
          />
        ))}
      </div>
    </div>
  );
}

function FriendRequestCard({
  request,
  onAccept,
  onReject,
  loading,
}: {
  request: Friend;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="surface p-4 flex gap-3 animate-fade-in-up">
      <Link href={`/profile/${request.id}`} className="shrink-0">
        <Avatar
          src={request.profile_picture_url}
          alt={request.full_name}
          size="lg"
          fallbackName={request.full_name}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${request.id}`}
          className="font-semibold text-slate-900 dark:text-slate-50 hover:underline block truncate"
        >
          {request.full_name}
        </Link>
        {(request.mutual_friends_count ?? 0) > 0 && (
          <p className="text-xs text-slate-500 mt-0.5">
            {request.mutual_friends_count} amigos en común
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            leftIcon={<Check size={14} />}
            onClick={onAccept}
            loading={loading}
            className="flex-1"
          >
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<X size={14} />}
            onClick={onReject}
            disabled={loading}
            className="flex-1"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Suggestions tab ──────────────────────────────────────────────────────────

function SuggestionsTab() {
  const {
    data: suggestions,
    loading,
    refresh,
  } = useApi(() => friendsApi.getSuggestions({ limit: 24 }), []);
  const toast = useToast();
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { execute: sendReq } = useMutation((id: string) =>
    friendsApi.sendRequest(id),
  );
  const { execute: dismiss } = useMutation((id: string) =>
    friendsApi.dismissSuggestion(id),
  );

  const handleAdd = async (s: FriendSuggestion) => {
    await sendReq(String(s.id));
    setSent((prev) => new Set([...prev, String(s.id)]));
    toast.success(`Solicitud enviada a ${s.full_name}`);
  };

  const handleDismiss = async (s: FriendSuggestion) => {
    await dismiss(String(s.id));
    setDismissed((prev) => new Set([...prev, String(s.id)]));
  };

  const visible = (suggestions ?? []).filter(
    (s) => !dismissed.has(String(s.id)),
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SuggestionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="Sin sugerencias"
        description="No hay sugerencias de amistad por ahora. ¡Vuelve más tarde!"
        className="py-16"
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Personas que quizás conozcas
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {visible.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            added={sent.has(String(s.id))}
            onAdd={() => handleAdd(s)}
            onDismiss={() => handleDismiss(s)}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion: s,
  added,
  onAdd,
  onDismiss,
}: {
  suggestion: FriendSuggestion;
  added: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="surface p-3 flex flex-col animate-fade-in-scale">
      {/* Dismiss */}
      <div className="flex justify-end mb-1">
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Descartar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Avatar */}
      <Link href={`/profile/${s.id}`} className="mx-auto">
        <Avatar
          src={s.profile_picture_url}
          alt={s.full_name}
          size="xl"
          fallbackName={s.full_name}
        />
      </Link>

      {/* Info */}
      <div className="mt-2 text-center flex-1 min-w-0">
        <Link
          href={`/profile/${s.id}`}
          className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:underline block truncate"
        >
          {s.full_name}
        </Link>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
          {(s.mutual_friends_count ?? 0) > 0
            ? `${s.mutual_friends_count} amigos en común`
            : (s.reason ?? `@${s.username}`)}
        </p>
      </div>

      {/* Action */}
      <div className="mt-3">
        {added ? (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            leftIcon={<UserCheck size={14} />}
          >
            Solicitud enviada
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            leftIcon={<UserPlus size={14} />}
            onClick={onAdd}
          >
            Agregar
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── All friends tab ──────────────────────────────────────────────────────────

function AllFriendsTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const {
    items: friends,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) =>
      friendsApi.getFriends({
        limit,
        offset,
        search: debouncedSearch || undefined,
      }),
    [debouncedSearch],
    24,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const { execute: unfriend } = useMutation((id: string) =>
    friendsApi.unfriend(id),
  );
  const [unfriended, setUnfriended] = useState<Set<string>>(new Set());

  const handleUnfriend = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} de tus amigos?`)) return;
    await unfriend(id);
    setUnfriended((prev) => new Set([...prev, id]));
    toast.info(`Ya no eres amigo/a de ${name}`);
  };

  const visible = friends.filter((f) => !unfriended.has(f.id));

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          placeholder="Buscar amigos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FriendListSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon={<Users size={32} />}
          title={search ? "Sin resultados" : "Sin amigos aún"}
          description={
            search
              ? `No encontramos amigos que coincidan con "${search}".`
              : "¡Empieza a conectar con personas que conoces!"
          }
          className="py-16"
        />
      )}

      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((f) => (
            <FriendListCard
              key={f.id}
              friend={f}
              onUnfriend={() => handleUnfriend(f.id, f.full_name)}
            />
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <FriendListSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

function FriendListCard({
  friend: f,
  onUnfriend,
}: {
  friend: Friend;
  onUnfriend: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="surface p-3 flex items-center gap-3 animate-fade-in">
      <Link href={`/profile/${f.id}`} className="shrink-0">
        <Avatar
          src={f.profile_picture_url}
          alt={f.full_name}
          size="md"
          fallbackName={f.full_name}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${f.id}`}
          className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:underline block truncate"
        >
          {f.full_name}
        </Link>
        {(f.mutual_friends_count ?? 0) > 0 && (
          <p className="text-xs text-slate-500">
            {f.mutual_friends_count} amigos en común
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/messages?user=${f.id}`}>
          <Button variant="secondary" size="sm">
            Mensaje
          </Button>
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-400"
          >
            <ChevronDown size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 py-1 min-w-[160px] z-10 animate-fade-in-down">
              <Link
                href={`/profile/${f.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700"
              >
                Ver perfil
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onUnfriend();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
              >
                <UserX size={14} />
                Eliminar amistad
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Birthdays tab ────────────────────────────────────────────────────────────

function BirthdaysTab() {
  const { data: birthdays, loading } = useApi(
    () => friendsApi.getBirthdays(),
    [],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-12 h-12" rounded />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!birthdays || birthdays.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-4xl">🎂</span>}
        title="Sin cumpleaños próximos"
        description="Cuando tus amigos tengan cumpleaños en los próximos días, los verás aquí."
        className="py-16"
      />
    );
  }

  const today = birthdays.filter((b) => b.days_until === 0);
  const upcoming = birthdays.filter((b) => b.days_until > 0);

  return (
    <div className="space-y-6">
      {today.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span>🎂</span> Hoy
          </h2>
          <div className="space-y-2">
            {today.map((b) => (
              <BirthdayCard key={b.user_id} birthday={b} isToday />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">
            Próximos cumpleaños
          </h2>
          <div className="space-y-2">
            {upcoming.map((b) => (
              <BirthdayCard key={b.user_id} birthday={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BirthdayCard({
  birthday: b,
  isToday,
}: {
  birthday: any;
  isToday?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface p-4 flex items-center gap-3 animate-fade-in",
        isToday && "border-l-4 border-l-indigo-500",
      )}
    >
      <Link href={`/profile/${b.user_id}`} className="shrink-0">
        <Avatar
          src={b.profile_picture_url}
          alt={b.full_name}
          size="md"
          fallbackName={b.full_name}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${b.user_id}`}
          className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:underline"
        >
          {b.full_name}
        </Link>
        <p className="text-xs text-slate-500 mt-0.5">
          {isToday ? (
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              🎉 ¡Hoy es su cumpleaños!
            </span>
          ) : (
            `En ${b.days_until} ${b.days_until === 1 ? "día" : "días"}`
          )}
        </p>
      </div>
      {isToday && (
        <Link href={`/messages?user=${b.user_id}`}>
          <Button size="sm" variant="secondary">
            Felicitar
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── Skeleton components ──────────────────────────────────────────────────────

function RequestSkeleton() {
  return (
    <div className="surface p-4 flex gap-3">
      <Skeleton className="w-14 h-14 shrink-0" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-20" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  );
}

function SuggestionSkeleton() {
  return (
    <div className="surface p-3 space-y-3">
      <Skeleton className="aspect-square rounded-xl" />
      <Skeleton className="h-3 w-3/4 mx-auto" />
      <Skeleton className="h-2.5 w-1/2 mx-auto" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

function FriendListSkeleton() {
  return (
    <div className="surface p-3 flex items-center gap-3">
      <Skeleton className="w-11 h-11 shrink-0" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { UserPlus, Calendar } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi, useMutation } from "@/hooks/useApi";
import { friendsApi } from "@/lib/api-friends";
import { eventsApi } from "@/lib/api-events";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function SidebarRight() {
  const { data: suggestions, loading: loadingSug } = useApi(
    () => friendsApi.getSuggestions({ limit: 5 }),
    [],
  );
  const { data: events, loading: loadingEvt } = useApi(
    () => eventsApi.getUpcoming(),
    [],
  );
  const { execute: sendReq } = useMutation((id: string) =>
    friendsApi.sendRequest(id),
  );
  const toast = useToast();

  const handleAddFriend = async (userId: string, name: string) => {
    await sendReq(userId);
    toast.success(`Solicitud enviada a ${name}`);
  };

  return (
    <aside className="hidden xl:block w-[280px] shrink-0 space-y-4">
      {/* Friend suggestions */}
      <div className="surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            Personas que quizás conozcas
          </h3>
          <Link
            href="/friends"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Ver todo
          </Link>
        </div>

        {loadingSug
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-10 h-10" rounded />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-7 w-16" />
              </div>
            ))
          : suggestions?.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2">
                <Link href={`/profile/${s.id}`}>
                  <Avatar
                    src={s.profile_picture_url}
                    alt={s.full_name}
                    size="md"
                    fallbackName={s.full_name}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${s.id}`}
                    className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block hover:underline"
                  >
                    {s.full_name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">
                    {s.mutual_friends_count
                      ? `${s.mutual_friends_count} amigos en común`
                      : (s.reason ?? "@" + s.username)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<UserPlus size={13} />}
                  onClick={() => handleAddFriend(String(s.id), s.full_name)}
                >
                  Agregar
                </Button>
              </div>
            ))}
      </div>

      {/* Upcoming events */}
      {!loadingEvt && events && events.length > 0 && (
        <div className="surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Próximos eventos
            </h3>
            <Link
              href="/events"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver todo
            </Link>
          </div>

          {events.slice(0, 3).map((ev) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="flex gap-3 py-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg px-1 transition-colors -mx-1"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-none">
                  {format(new Date(ev.start_time), "MMM", { locale: es })}
                </span>
                <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 leading-none">
                  {format(new Date(ev.start_time), "d")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {ev.name}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={11} />
                  {format(new Date(ev.start_time), "EEE d, HH:mm", {
                    locale: es,
                  })}
                </p>
                {ev.location && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {ev.location}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

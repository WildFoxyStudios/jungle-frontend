"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  Plus,
  Search,
  Users,
  Settings,
  LogIn,
  CheckCircle,
} from "lucide-react";
import { groupsApi } from "@/lib/api-groups";
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
import type { Group } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
          Grupos
        </h1>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Crear grupo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="discover">
        <div className="surface mb-4">
          <TabList className="px-2">
            <Tab value="discover">Descubrir</Tab>
            <Tab value="my-groups">Mis grupos</Tab>
          </TabList>
        </div>

        <TabPanel value="discover">
          <DiscoverTab />
        </TabPanel>
        <TabPanel value="my-groups">
          <MyGroupsTab />
        </TabPanel>
      </Tabs>

      {/* Create group modal */}
      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

// ─── Discover tab ─────────────────────────────────────────────────────────────

function DiscoverTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    items: groups,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) => groupsApi.list({ limit, offset }),
    [],
    12,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const toast = useToast();
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const { execute: joinGroup } = useMutation((id: string) =>
    groupsApi.join(id),
  );

  const handleJoin = async (groupId: string, name: string) => {
    await joinGroup(groupId);
    setJoined((prev) => new Set([...prev, groupId]));
    toast.success(`Te uniste a "${name}"`);
  };

  const filtered = search
    ? groups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : groups;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Buscar grupos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Users size={32} />}
          title="Sin grupos"
          description={
            search
              ? `No encontramos grupos que coincidan con "${search}".`
              : "No hay grupos disponibles por el momento."
          }
          className="py-16"
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group, i) => (
            <GroupCard
              key={group.id}
              group={group}
              joined={joined.has(group.id)}
              onJoin={() => handleJoin(group.id, group.name)}
              index={i}
            />
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

// ─── My groups tab ────────────────────────────────────────────────────────────

function MyGroupsTab() {
  const { data: groups, loading } = useApi(() => groupsApi.list(), []);
  const toast = useToast();
  const { execute: leaveGroup } = useMutation((id: string) =>
    groupsApi.leave(id),
  );
  const [left, setLeft] = useState<Set<string>>(new Set());

  const handleLeave = async (groupId: string, name: string) => {
    if (!confirm(`¿Salir del grupo "${name}"?`)) return;
    await leaveGroup(groupId);
    setLeft((prev) => new Set([...prev, groupId]));
    toast.info(`Saliste de "${name}"`);
  };

  const visible = (groups ?? []).filter((g) => !left.has(g.id));

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <GroupCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="Aún no perteneces a ningún grupo"
        description="Descubre grupos de tus intereses y únete a la conversación."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              const tab = document.querySelector(
                '[role="tab"][aria-selected="false"]',
              ) as HTMLButtonElement;
              tab?.click();
            }}
          >
            Descubrir grupos
          </Button>
        }
        className="py-16"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visible.map((group, i) => (
        <GroupCard
          key={group.id}
          group={group}
          joined
          isMember
          onLeave={() => handleLeave(group.id, group.name)}
          index={i}
        />
      ))}
    </div>
  );
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({
  group,
  joined,
  isMember,
  onJoin,
  onLeave,
  index = 0,
}: {
  group: Group;
  joined?: boolean;
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  index?: number;
}) {
  return (
    <div
      className={cn(
        "surface flex flex-col overflow-hidden animate-fade-in-up hover:shadow-md transition-shadow",
        `stagger-${(index % 5) + 1}`,
      )}
    >
      {/* Cover / header */}
      <div className="relative h-32 bg-gradient-to-br from-indigo-400 to-purple-500 overflow-hidden">
        {group.cover_url ? (
          <img
            src={group.cover_url}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users size={40} className="text-white/60" />
          </div>
        )}
        {/* Privacy badge */}
        <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium rounded-full">
          {group.privacy === "public" ? (
            <Globe size={11} />
          ) : (
            <Lock size={11} />
          )}
          {group.privacy === "public" ? "Público" : "Privado"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <Link href={`/groups/${group.id}`}>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1">
              {group.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Users size={11} />
            {group.members_count.toLocaleString()} miembros
          </p>
          {group.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
              {group.description}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="mt-auto">
          {isMember ? (
            <div className="flex gap-2">
              <Link href={`/groups/${group.id}`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  Ver grupo
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Salir
              </Button>
            </div>
          ) : joined ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              leftIcon={<CheckCircle size={14} />}
            >
              {group.privacy === "private" ? "Solicitud enviada" : "Miembro"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              leftIcon={<LogIn size={14} />}
              onClick={onJoin}
            >
              {group.privacy === "private" ? "Solicitar unirse" : "Unirse"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create group modal ───────────────────────────────────────────────────────

function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const group = await groupsApi.create({
        name: name.trim(),
        description,
        privacy,
      });
      toast.success(`Grupo "${group.name}" creado exitosamente`);
      setName("");
      setDescription("");
      setPrivacy("public");
      onClose();
      // Navigate to the new group
      window.location.href = `/groups/${group.id}`;
    } catch {
      toast.error("Error al crear el grupo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear grupo"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            disabled={!name.trim()}
          >
            Crear grupo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre del grupo <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            placeholder="Ej: Amantes del café ☕"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoFocus
          />
          <p className="text-xs text-slate-400 text-right">{name.length}/80</p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            placeholder="¿De qué trata tu grupo?"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Privacy */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Privacidad
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  value: "public",
                  icon: Globe,
                  label: "Público",
                  desc: "Cualquiera puede ver y unirse",
                },
                {
                  value: "private",
                  icon: Lock,
                  label: "Privado",
                  desc: "Solo miembros pueden ver el contenido",
                },
              ] as const
            ).map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPrivacy(value)}
                className={cn(
                  "flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all",
                  privacy === value
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                )}
              >
                <Icon
                  size={20}
                  className={
                    privacy === value
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500"
                  }
                />
                <span
                  className={cn(
                    "font-semibold text-sm",
                    privacy === value
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-200",
                  )}
                >
                  {label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GroupCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="h-32 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  );
}

"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Lock,
  Globe,
  Settings,
  UserPlus,
  LogOut,
  Plus,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Camera,
  BellOff,
  Share2,
  Flag,
  Pin,
  Trash2,
  Search,
  Check,
  Heart,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";import { groupsApi } from "@/lib/api-groups";
import { friendsApi } from "@/lib/api-friends";
import { uploadApi, validateFile } from "@/lib/api-upload";
import { useAuth } from "@/contexts/AuthContext";
import { useApi, useMutation, useInfiniteApi } from "@/hooks/useApi";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Dropdown } from "@/components/ui/dropdown";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { PostSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { RichContent } from "@/components/ui/rich-content";
import type { Group, GroupMember, GroupPost } from "@/lib/types";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { user } = useAuth();
  const toast = useToast();

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    data: group,
    loading: loadingGroup,
    refresh: refreshGroup,
  } = useApi(() => groupsApi.get(groupId), [groupId]);

  const {
    data: members,
    loading: loadingMembers,
    refresh: refreshMembers,
  } = useApi(() => groupsApi.getMembers(groupId), [groupId]);

  // ── Member role ───────────────────────────────────────────────────────────
  const myMembership = members?.find((m) => m.user_id === user?.id);
  const isMember = !!myMembership;
  const isAdmin =
    myMembership?.role === "admin" || myMembership?.role === "moderator";

  // ── Actions ───────────────────────────────────────────────────────────────
  const { execute: joinGroup, loading: joining } = useMutation(() =>
    groupsApi.join(groupId),
  );
  const { execute: leaveGroup } = useMutation(() =>
    groupsApi.leave(groupId),
  );

  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleJoin = async () => {
    try {
      await joinGroup();
      toast.success(
        group?.privacy === "private"
          ? "Solicitud enviada al grupo"
          : "Te uniste al grupo",
      );
      refreshMembers();
      refreshGroup();
    } catch {
      toast.error("Error al unirse al grupo");
    }
  };

  const handleLeave = async () => {
    if (!confirm("¿Salir del grupo?")) return;
    try {
      await leaveGroup();
      toast.info("Saliste del grupo");
      refreshMembers();
      refreshGroup();
    } catch {
      toast.error("Error al salir del grupo");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingGroup) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="w-20 h-20 rounded-xl" />
          <div className="flex-1 space-y-2 pt-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="Grupo no encontrado"
        description="Este grupo no existe o fue eliminado."
        className="min-h-[60vh]"
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[900px] mx-auto pb-20">
      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative h-[200px] md:h-[300px] bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden rounded-b-2xl">
          {group.cover_url ? (
            <Image
              src={group.cover_url}
              alt={group.name}
              fill
              sizes="(max-width: 900px) 100vw, 900px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users size={80} className="text-white/20" />
            </div>
          )}
        </div>
      </div>

      {/* ── Header info ───────────────────────────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Group avatar */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 shrink-0 border-4 border-white dark:border-gray-900 shadow-lg -mt-12 relative z-10">
            {group.picture_url ? (
              <img
                src={group.picture_url}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users size={32} className="text-white/80" />
              </div>
            )}
          </div>

          <div className="pt-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
              {group.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                {group.privacy === "public" ? (
                  <Globe size={14} />
                ) : (
                  <Lock size={14} />
                )}
                {group.privacy === "public" ? "Público" : "Privado"}
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Users size={14} />
                {group.members_count.toLocaleString()} miembros
              </span>
            </div>
            {group.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-lg line-clamp-2">
                <RichContent content={group.description} />
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isMember ? (
            <>
              <Button
                leftIcon={<Plus size={15} />}
                size="sm"
                onClick={() => setCreatePostOpen(true)}
              >
                Publicar
              </Button>
              <Button
                variant="secondary"
                leftIcon={<UserPlus size={15} />}
                size="sm"
                onClick={() => setInviteOpen(true)}
              >
                Invitar
              </Button>
              <Dropdown
                trigger={
                  <button className="p-2 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-slate-300">
                    <MoreHorizontal size={18} />
                  </button>
                }
                items={[
                  {
                    label: "Silenciar grupo",
                    icon: <BellOff size={15} />,
                    onClick: () => toast.info("Notificaciones silenciadas"),
                  },
                  {
                    label: "Compartir grupo",
                    icon: <Share2 size={15} />,
                    onClick: () => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Enlace copiado");
                    },
                  },
                  { separator: true as const },
                  {
                    label: "Salir del grupo",
                    icon: <LogOut size={15} />,
                    onClick: handleLeave,
                    danger: true,
                  },
                ]}
              />
            </>
          ) : (
            <>
              <Button
                leftIcon={<UserPlus size={15} />}
                size="sm"
                loading={joining}
                onClick={handleJoin}
              >
                {group.privacy === "private" ? "Solicitar unirse" : "Unirse"}
              </Button>
              <Dropdown
                trigger={
                  <button className="p-2 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-slate-300">
                    <MoreHorizontal size={18} />
                  </button>
                }
                items={[
                  {
                    label: "Compartir grupo",
                    icon: <Share2 size={15} />,
                    onClick: () => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Enlace copiado");
                    },
                  },
                  {
                    label: "Reportar",
                    icon: <Flag size={15} />,
                    onClick: () => toast.info("Reporte enviado"),
                    danger: true,
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="px-4">
        <Tabs defaultTab="posts">
          <div className="surface mb-4">
            <TabList className="px-2">
              <Tab value="posts">Publicaciones</Tab>
              <Tab value="members">Miembros</Tab>
              {isAdmin && <Tab value="admin">Administrar</Tab>}
              <Tab value="about">Información</Tab>
            </TabList>
          </div>

          {/* ── Posts ────────────────────────────────────────────────────── */}
          <TabPanel value="posts">
            <GroupPostsFeed
              groupId={groupId}
              isMember={isMember}
              isAdmin={isAdmin}
              onCreatePost={() => setCreatePostOpen(true)}
            />
          </TabPanel>

          {/* ── Members ──────────────────────────────────────────────────── */}
          <TabPanel value="members">
            <GroupMembersTab
              groupId={groupId}
              members={members ?? []}
              loading={loadingMembers}
              isAdmin={isAdmin}
              currentUserId={user?.id ?? ""}
              onRefresh={refreshMembers}
            />
          </TabPanel>

          {/* ── Admin ────────────────────────────────────────────────────── */}
          {isAdmin && (
            <TabPanel value="admin">
              <GroupAdminTab groupId={groupId} group={group} onGroupUpdated={refreshGroup} />
            </TabPanel>
          )}

          {/* ── About ────────────────────────────────────────────────────── */}
          <TabPanel value="about">
            <GroupAboutTab group={group} />
          </TabPanel>
        </Tabs>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <CreateGroupPostModal
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        groupId={groupId}
        groupName={group.name}
        onCreated={() => {
          window.dispatchEvent(new CustomEvent("refresh-group-posts"));
        }}
      />

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupId={groupId}
      />
    </div>
  );
}

// ─── Posts feed ───────────────────────────────────────────────────────────────

function GroupPostsFeed({
  groupId,
  isMember,
  isAdmin,
  onCreatePost,
}: {
  groupId: string;
  isMember: boolean;
  isAdmin: boolean;
  onCreatePost: () => void;
}) {
  const {
    items: posts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) => groupsApi.getPosts(groupId),
    [groupId],
    12,
  );

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const toast = useToast();

  // Listen for refresh event from CreateGroupPostModal
  useEffect(() => {
    const handleRefresh = () => refresh();
    window.addEventListener("refresh-group-posts", handleRefresh);
    return () => window.removeEventListener("refresh-group-posts", handleRefresh);
  }, [refresh]);

  return (
    <div className="space-y-4">
      {/* Create post prompt */}
      {isMember && (
        <div
          className="surface p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/60 transition-colors"
          onClick={onCreatePost}
        >
          <Avatar size="md" />
          <div className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-800 rounded-full text-slate-400 text-sm hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
            Escribe algo en el grupo...
          </div>
        </div>
      )}

      {/* Posts */}
      {loading &&
        Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}

      {!loading && posts.length === 0 && (
        <EmptyState
          icon={<Plus size={32} />}
          title="Sin publicaciones aún"
          description={
            isMember
              ? "Sé el primero en publicar algo en este grupo."
              : "Únete al grupo para ver las publicaciones."
          }
          action={
            isMember ? (
              <Button onClick={onCreatePost} leftIcon={<Plus size={15} />}>
                Primera publicación
              </Button>
            ) : undefined
          }
          className="py-16"
        />
      )}

      {posts.map((post, i) => (
        <GroupPostCard key={post.id} post={post} index={i} groupId={groupId} isAdmin={isAdmin} onPostChanged={refresh} />
      ))}

      {loadingMore && <PostSkeleton />}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

// ─── Group post card ──────────────────────────────────────────────────────────

function GroupPostCard({ post, index, groupId, isAdmin, onPostChanged }: { post: GroupPost; index: number; groupId: string; isAdmin: boolean; onPostChanged: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const isOwner = post.author_id === user?.id;
  const canModerate = isAdmin || isOwner;

  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes_count);

  const handleLike = () => {
    setLiked((v) => !v);
    setLocalLikes((c) => c + (liked ? -1 : 1));
    // Group posts don't have a dedicated like API yet — optimistic UI only
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta publicación?")) return;
    try {
      await groupsApi.deletePost(groupId, post.id);
      toast.success("Publicación eliminada");
      onPostChanged();
    } catch {
      toast.error("Error al eliminar la publicación");
    }
  };

  const handleTogglePin = async () => {
    try {
      await groupsApi.togglePin(groupId, post.id);
      toast.success(post.is_pinned ? "Publicación desfijada" : "Publicación fijada");
      onPostChanged();
    } catch {
      toast.error("Error al cambiar el estado de fijado");
    }
  };

  const dropdownItems: any[] = [];
  if (canModerate) {
    dropdownItems.push({
      label: post.is_pinned ? "Desfijar publicación" : "Fijar publicación",
      icon: <Pin size={15} />,
      onClick: handleTogglePin,
    });
    dropdownItems.push({
      label: "Eliminar publicación",
      icon: <Trash2 size={15} />,
      onClick: handleDelete,
      danger: true,
    });
  }
  if (!canModerate) {
    dropdownItems.push({
      label: "Reportar",
      icon: <Flag size={15} />,
      onClick: () => toast.info("Reporte enviado"),
      danger: true,
    });
  }

  return (
    <article
      className={cn("surface animate-fade-in-up", `stagger-${(index % 5) + 1}`)}
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          <Pin size={12} />
          Publicación fijada
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author_id}`}>
            <Avatar
              src={post.author_picture}
              alt={post.author_name}
              size="md"
              fallbackName={post.author_name ?? ""}
            />
          </Link>
          <div>
            <Link
              href={`/profile/${post.author_id}`}
              className="font-semibold text-sm text-slate-900 dark:text-slate-50 hover:underline"
            >
              {post.author_name ?? "Usuario"}
            </Link>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
        </div>

        <Dropdown
          trigger={
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-400">
              <MoreHorizontal size={18} />
            </button>
          }
          items={dropdownItems}
        />
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
          <RichContent content={post.content} />
        </p>
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div
          className={cn(
            "overflow-hidden",
            post.media_urls.length === 1 ? "" : "grid grid-cols-2 gap-1",
          )}
        >
          {post.media_urls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-slate-900",
                post.media_urls?.length === 1 && "max-h-96",
              )}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {i === 3 && (post.media_urls?.length ?? 0) > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{(post.media_urls?.length ?? 0) - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
        <button
          onClick={handleLike}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors",
            liked
              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800",
          )}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          {localLikes > 0 ? localLikes : "Me gusta"}
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
          <MessageCircle size={16} />
          {post.comments_count > 0 ? post.comments_count : "Comentar"}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/groups/${groupId}?post=${post.id}`);
            toast.success("Enlace copiado");
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </button>
      </div>
    </article>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function GroupMembersTab({
  groupId,
  members,
  loading,
  isAdmin,
  currentUserId,
  onRefresh,
}: {
  groupId: string;
  members: GroupMember[];
  loading: boolean;
  isAdmin: boolean;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const { execute: removeMember } = useMutation((userId: string) =>
    groupsApi.removeMember(groupId, userId),
  );
  const { execute: updateRole } = useMutation(
    ({ userId, role }: { userId: string; role: any }) =>
      groupsApi.updateMemberRole(groupId, userId, { role }),
  );

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`¿Expulsar a ${name} del grupo?`)) return;
    try {
      await removeMember(userId);
      toast.success(`${name} fue expulsado/a del grupo`);
      onRefresh();
    } catch {
      toast.error("Error al expulsar al miembro");
    }
  };

  const handlePromote = async (userId: string, name: string) => {
    try {
      await updateRole({ userId, role: "moderator" });
      toast.success(`${name} es ahora moderador/a`);
      onRefresh();
    } catch {
      toast.error("Error al cambiar el rol");
    }
  };

  const filtered = members.filter(
    (m) =>
      !search ||
      (m.full_name ?? m.username ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const admins = filtered.filter((m) => m.role === "admin");
  const mods = filtered.filter((m) => m.role === "moderator");
  const regular = filtered.filter(
    (m) => m.role !== "admin" && m.role !== "moderator" && m.role !== "pending",
  );
  const pending = filtered.filter((m) => m.role === "pending");

  return (
    <div className="surface p-4 space-y-4">
      {/* Search */}
      <input
        type="search"
        placeholder="Buscar miembros..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-base"
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10" rounded />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Admins */}
          {admins.length > 0 && (
            <MemberGroup
              title="Administradores"
              icon={<Shield size={15} className="text-amber-500" />}
              members={admins}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onRemove={handleRemove}
              onPromote={handlePromote}
            />
          )}

          {/* Moderators */}
          {mods.length > 0 && (
            <MemberGroup
              title="Moderadores"
              icon={<Shield size={15} className="text-indigo-500" />}
              members={mods}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onRemove={handleRemove}
              onPromote={handlePromote}
            />
          )}

          {/* Pending */}
          {pending.length > 0 && isAdmin && (
            <PendingGroup
              members={pending}
              groupId={groupId}
              onRefresh={onRefresh}
            />
          )}

          {/* Regular members */}
          {regular.length > 0 && (
            <MemberGroup
              title={`Miembros · ${regular.length}`}
              members={regular}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onRemove={handleRemove}
              onPromote={handlePromote}
            />
          )}

          {filtered.length === 0 && (
            <EmptyState
              title="Sin resultados"
              description="No se encontraron miembros con ese nombre."
            />
          )}
        </div>
      )}
    </div>
  );
}

function MemberGroup({
  title,
  icon,
  members,
  currentUserId,
  isAdmin,
  onRemove,
  onPromote,
}: {
  title: string;
  icon?: React.ReactNode;
  members: GroupMember[];
  currentUserId: string;
  isAdmin: boolean;
  onRemove: (id: string, name: string) => void;
  onPromote: (id: string, name: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      <div className="space-y-1">
        {members.map((m) => {
          const name = m.full_name ?? m.username ?? "Usuario";
          const isMe = m.user_id === currentUserId;
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <Link href={`/profile/${m.user_id}`}>
                <Avatar
                  src={m.profile_picture_url}
                  alt={name}
                  size="md"
                  fallbackName={name}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${m.user_id}`}
                  className="text-sm font-semibold text-slate-900 dark:text-slate-50 hover:underline truncate block"
                >
                  {name}{" "}
                  {isMe && (
                    <span className="text-slate-400 font-normal">(tú)</span>
                  )}
                </Link>
                <p className="text-xs text-slate-400 capitalize">{m.role}</p>
              </div>
              {isAdmin && !isMe && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dropdown
                    trigger={
                      <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-400 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    }
                    items={[
                      m.role === "member"
                        ? {
                            label: "Hacer moderador",
                            icon: <Shield size={14} />,
                            onClick: () => onPromote(m.user_id, name),
                          }
                        : {
                            label: "Quitar moderador",
                            icon: <UserX size={14} />,
                            onClick: () => {},
                          },
                      { separator: true as const },
                      {
                        label: "Expulsar del grupo",
                        icon: <UserX size={14} />,
                        onClick: () => onRemove(m.user_id, name),
                        danger: true,
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendingGroup({
  members,
  groupId,
  onRefresh,
}: {
  members: GroupMember[];
  groupId: string;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const { execute: approve } = useMutation((userId: string) =>
    groupsApi.approveMember(groupId, userId),
  );
  const { execute: remove } = useMutation((userId: string) =>
    groupsApi.removeMember(groupId, userId),
  );
  const [handling, setHandling] = useState<Set<string>>(new Set());

  const handle = async (userId: string, action: "approve" | "reject") => {
    setHandling((h) => new Set([...h, userId]));
    try {
      if (action === "approve") {
        await approve(userId);
        toast.success("Solicitud aprobada");
      } else {
        await remove(userId);
        toast.info("Solicitud rechazada");
      }
      onRefresh();
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setHandling((h) => {
        const n = new Set(h);
        n.delete(userId);
        return n;
      });
    }
  };

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <UserCheck size={14} className="text-green-500" />
        Solicitudes pendientes · {members.length}
      </h3>
      <div className="space-y-2">
        {members.map((m) => {
          const name = m.full_name ?? m.username ?? "Usuario";
          const isHandling = handling.has(m.user_id);
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30"
            >
              <Avatar
                src={m.profile_picture_url}
                alt={name}
                size="md"
                fallbackName={name}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                  {name}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  leftIcon={<UserCheck size={13} />}
                  onClick={() => handle(m.user_id, "approve")}
                  loading={isHandling}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<UserX size={13} />}
                  onClick={() => handle(m.user_id, "reject")}
                  disabled={isHandling}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Rechazar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Admin tab ────────────────────────────────────────────────────────────────

function GroupAdminTab({ groupId, group, onGroupUpdated }: { groupId: string; group: Group; onGroupUpdated: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [privacy, setPrivacy] = useState(group.privacy);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await groupsApi.update(groupId, { name: name.trim(), description: description.trim(), privacy });
      toast.success("Grupo actualizado");
      onGroupUpdated();
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await groupsApi.delete(groupId);
      toast.success("Grupo eliminado");
      router.push("/groups");
    } catch {
      toast.error("Error al eliminar el grupo");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateFile(file, { allowedTypes: ["image/jpeg", "image/png", "image/webp"], maxSizeBytes: 10 * 1024 * 1024 });
      setUploadingCover(true);
      const res = await uploadApi.uploadCoverPhoto(file);
      await groupsApi.update(groupId, { cover_url: res.url });
      toast.success("Foto de portada actualizada");
      onGroupUpdated();
    } catch (err: any) {
      toast.error(err.message ?? "Error al subir la imagen");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateFile(file, { allowedTypes: ["image/jpeg", "image/png", "image/webp"], maxSizeBytes: 5 * 1024 * 1024 });
      setUploadingAvatar(true);
      const res = await uploadApi.uploadProfilePicture(file);
      await groupsApi.update(groupId, { picture_url: res.url });
      toast.success("Avatar del grupo actualizado");
      onGroupUpdated();
    } catch (err: any) {
      toast.error(err.message ?? "Error al subir la imagen");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="surface p-6 space-y-6 max-w-[600px]">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
        <Settings size={20} className="text-indigo-500" />
        Configuración del grupo
      </h2>

      {/* Image uploads */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Imágenes</label>
        <div className="flex gap-3">
          <label className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors text-sm", uploadingCover && "opacity-50 pointer-events-none")}>
            <Camera size={14} />
            {uploadingCover ? "Subiendo..." : "Portada"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
          </label>
          <label className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors text-sm", uploadingAvatar && "opacity-50 pointer-events-none")}>
            <Camera size={14} />
            {uploadingAvatar ? "Subiendo..." : "Avatar"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre del grupo
          </label>
          <input
            className="input-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            className="input-base resize-none"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Privacidad
          </label>
          <select
            className="input-base"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as any)}
          >
            <option value="public">Público</option>
            <option value="private">Privado</option>
          </select>
        </div>
      </div>

      <Button onClick={handleSave} loading={saving} disabled={!name.trim()}>
        Guardar cambios
      </Button>

      <hr className="border-slate-200 dark:border-slate-700" />

      {/* Danger zone */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
          Zona de peligro
        </h3>
        {!confirmDelete ? (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Eliminar grupo
          </Button>
        ) : (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              ¿Estás seguro? Se eliminarán todas las publicaciones, miembros y datos del grupo. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Sí, eliminar grupo
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── About tab ────────────────────────────────────────────────────────────────

function GroupAboutTab({ group }: { group: Group }) {
  return (
    <div className="surface p-6 space-y-4 max-w-[600px]">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
        Acerca del grupo
      </h2>

      {group.description && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Descripción
          </h4>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            <RichContent content={group.description} />
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl text-center">
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {group.members_count.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Miembros</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-gray-800 rounded-xl text-center">
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {group.posts_count.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Publicaciones</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        {group.privacy === "public" ? (
          <Globe size={16} className="text-slate-400" />
        ) : (
          <Lock size={16} className="text-slate-400" />
        )}
        <span>
          {group.privacy === "public"
            ? "Grupo público: cualquiera puede ver el contenido"
            : "Grupo privado: solo los miembros pueden ver el contenido"}
        </span>
      </div>
    </div>
  );
}

// ─── Create post modal ────────────────────────────────────────────────────────

function CreateGroupPostModal({
  open,
  onClose,
  groupId,
  groupName,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const results = await uploadApi.uploadPostMedia(Array.from(files));
      setMediaUrls((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err: any) {
      toast.error(err.message ?? "Error al subir archivo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeMedia = (idx: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;
    setSaving(true);
    try {
      await groupsApi.createPost(groupId, {
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });
      toast.success("Publicación creada en el grupo");
      setContent("");
      setMediaUrls([]);
      onCreated?.();
      onClose();
    } catch {
      toast.error("Error al crear la publicación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Publicar en ${groupName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            loading={saving}
            disabled={!content.trim() && mediaUrls.length === 0}
          >
            Publicar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.profile_picture_url}
            alt={user?.full_name}
            size="md"
            fallbackName={user?.full_name ?? user?.username ?? ""}
          />
          <div>
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {user?.full_name ?? user?.username}
            </p>
            <p className="text-xs text-slate-500">Publicando en el grupo</p>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe algo para el grupo..."
          className="w-full min-h-[120px] resize-none border-none outline-none text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 bg-transparent"
          autoFocus
        />

        {/* Media previews */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-gray-800">
                {url.match(/\.(mp4|webm|mov)/) ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Media upload button */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
              uploading && "opacity-50 cursor-not-allowed",
            )}
          >
            <ImageIcon size={18} />
            {uploading ? "Subiendo..." : "Foto/Video"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({
  open,
  onClose,
  groupId,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const { data: friends, loading: loadingFriends } = useApi(
    () => friendsApi.getFriends({ search: debouncedSearch || undefined }),
    [debouncedSearch],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      await groupsApi.invite(groupId, { user_ids: Array.from(selected) });
      toast.success(`${selected.size} invitación(es) enviada(s)`);
      setSelected(new Set());
      setSearch("");
      onClose();
    } catch {
      toast.error("Error al enviar invitaciones");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invitar amigos al grupo"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleInvite} loading={sending} disabled={selected.size === 0}>
            Invitar ({selected.size})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar amigos por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
            autoFocus
          />
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {selected.size} amigo(s) seleccionado(s)
          </p>
        )}

        {/* Friends list */}
        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {loadingFriends && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-10 h-10" rounded />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          )}

          {!loadingFriends && (friends ?? []).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              {search ? "No se encontraron amigos" : "No tienes amigos para invitar"}
            </p>
          )}

          {!loadingFriends &&
            (friends ?? []).map((friend) => {
              const isSelected = selected.has(friend.id);
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => toggleSelect(friend.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                      : "hover:bg-slate-50 dark:hover:bg-gray-800",
                  )}
                >
                  <Avatar
                    src={friend.profile_picture_url}
                    alt={friend.full_name}
                    size="md"
                    fallbackName={friend.full_name ?? friend.username}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {friend.full_name || friend.username}
                    </p>
                    <p className="text-xs text-slate-400 truncate">@{friend.username}</p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300 dark:border-slate-600",
                  )}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Globe,
  Heart,
  UserPlus,
  UserCheck,
  MessageCircle,
  MoreHorizontal,
  Edit3,
  UserMinus,
  Flag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api-profile";
import { postsApi } from "@/lib/api-posts";
import { friendsApi } from "@/lib/api-friends";
import { albumsApi } from "@/lib/api-albums";
import { useApi } from "@/hooks/useApi";
import { useInfiniteApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useApi";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Dropdown } from "@/components/ui/dropdown";
import { PostCard } from "@/components/feed/post-card";
import {
  PostSkeleton,
  ProfileSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Metadata } from "next";

// ─── Types ────────────────────────────────────────────────────────────────────

type FriendshipState = "none" | "pending_sent" | "pending_received" | "friends";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { user: me } = useAuth();
  const toast = useToast();
  const isOwnProfile = me?.id === userId;

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: profile, loading: loadingProfile } = useApi(
    () => profileApi.getProfile(userId),
    [userId],
  );

  const {
    items: posts,
    loading: loadingPosts,
    loadingMore,
    hasMore,
    loadMore,
  } = useInfiniteApi(
    (offset, limit) => postsApi.getUserPosts(userId, limit, offset),
    [userId],
    12,
  );

  const { data: photos, loading: loadingPhotos } = useApi(
    () => albumsApi.getUserProfilePhotos(userId, { limit: 9 }),
    [userId],
  );

  // ── Friendship state ──────────────────────────────────────────────────────
  const [friendship, setFriendship] = useState<FriendshipState>("none");
  const { execute: sendReq, loading: sendingReq } = useMutation(() =>
    friendsApi.sendRequest(userId),
  );
  const { execute: unfriend } = useMutation(() => friendsApi.unfriend(userId));

  const handleFriendAction = async () => {
    if (friendship === "none") {
      await sendReq();
      setFriendship("pending_sent");
      toast.success("Solicitud enviada");
    } else if (friendship === "friends") {
      await unfriend();
      setFriendship("none");
      toast.info("Ya no son amigos");
    }
  };

  // ── UI state ──────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  // ─────────────────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-4 space-y-4">
        <ProfileSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="md:col-span-2 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Perfil no encontrado"
        description="Este usuario no existe o su cuenta está desactivada."
        className="min-h-[60vh]"
      />
    );
  }

  const { user, stats, education, work, places_lived, interests } = profile;
  const photosList = photos ?? [];

  return (
    <div className="max-w-[900px] mx-auto pb-20">
      {/* ── Cover + Avatar ──────────────────────────────────────────────── */}
      <div className="relative">
        {/* Cover photo */}
        <div className="relative h-[220px] md:h-[320px] bg-gradient-to-br from-indigo-400 to-purple-600 rounded-b-2xl overflow-hidden">
          {user.cover_photo_url ? (
            <Image
              src={user.cover_photo_url}
              alt="Portada"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          )}
          {isOwnProfile && (
            <button className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white transition-colors shadow">
              <Camera size={15} />
              Cambiar portada
            </button>
          )}
        </div>

        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 px-4 -mt-14 relative">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-[120px] h-[120px] rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-slate-200 dark:bg-gray-800 shadow-lg">
              {user.profile_picture_url ? (
                <Image
                  src={user.profile_picture_url}
                  alt={user.full_name ?? user.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <Avatar
                  alt={user.full_name}
                  size="2xl"
                  fallbackName={user.full_name ?? user.username}
                />
              )}
            </div>
            {isOwnProfile && (
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 flex items-center justify-center shadow border-2 border-white dark:border-gray-900 transition-colors">
                <Camera
                  size={14}
                  className="text-slate-600 dark:text-slate-300"
                />
              </button>
            )}
          </div>

          {/* Name + actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50">
                {user.full_name ?? user.username}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                @{user.username}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.friends_count} amigos · {stats.posts_count} publicaciones
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <Button
                  variant="secondary"
                  leftIcon={<Edit3 size={15} />}
                  onClick={() => setEditOpen(true)}
                  size="sm"
                >
                  Editar perfil
                </Button>
              ) : (
                <>
                  {friendship === "friends" ? (
                    <Button
                      variant="secondary"
                      leftIcon={<UserCheck size={15} />}
                      size="sm"
                      onClick={handleFriendAction}
                    >
                      Amigos
                    </Button>
                  ) : friendship === "pending_sent" ? (
                    <Button
                      variant="ghost"
                      leftIcon={<UserMinus size={15} />}
                      size="sm"
                      onClick={handleFriendAction}
                    >
                      Solicitud enviada
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<UserPlus size={15} />}
                      size="sm"
                      loading={sendingReq}
                      onClick={handleFriendAction}
                    >
                      Agregar amigo
                    </Button>
                  )}
                  <Link href={`/messages?user=${userId}`}>
                    <Button
                      variant="secondary"
                      leftIcon={<MessageCircle size={15} />}
                      size="sm"
                    >
                      Mensaje
                    </Button>
                  </Link>
                  <Dropdown
                    trigger={
                      <button className="p-2 rounded-lg bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors">
                        <MoreHorizontal
                          size={18}
                          className="text-slate-600 dark:text-slate-300"
                        />
                      </button>
                    }
                    items={[
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
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="mt-2 px-4">
        <Tabs defaultTab="posts">
          <div className="surface mb-4">
            <TabList className="px-2">
              <Tab value="posts">Publicaciones</Tab>
              <Tab value="about">Información</Tab>
              <Tab value="friends">Amigos</Tab>
              <Tab value="photos">Fotos</Tab>
            </TabList>
          </div>

          {/* ── Posts tab ────────────────────────────────────────────── */}
          <TabPanel value="posts">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left: intro card */}
              <div className="space-y-4">
                <IntroCard
                  user={user}
                  work={work}
                  education={education}
                  places={places_lived}
                  isOwnProfile={isOwnProfile}
                />
                {/* Photo grid preview */}
                {photosList.length > 0 && (
                  <div className="surface p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">
                        Fotos
                      </h3>
                      <Link
                        href={`/profile/${userId}?tab=photos`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Ver todas
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {photosList.slice(0, 9).map((p) => (
                        <div
                          key={p.id}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-gray-700"
                        >
                          <img
                            src={p.url}
                            alt={p.caption ?? ""}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: posts */}
              <div className="md:col-span-2 space-y-4">
                {loadingPosts &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                {!loadingPosts && posts.length === 0 && (
                  <EmptyState
                    title="Sin publicaciones aún"
                    description={
                      isOwnProfile
                        ? "Comparte algo con tus amigos."
                        : "Este usuario no tiene publicaciones."
                    }
                  />
                )}
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                {loadingMore && <PostSkeleton />}
                <div ref={sentinelRef} className="h-1" />
              </div>
            </div>
          </TabPanel>

          {/* ── About tab ────────────────────────────────────────────── */}
          <TabPanel value="about">
            <div className="surface p-6 space-y-6 max-w-[600px]">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Información
              </h2>

              {/* Bio */}
              {user.bio && (
                <Section title="Sobre mí">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {user.bio}
                  </p>
                </Section>
              )}

              {/* Work */}
              {work.length > 0 && (
                <Section title="Trabajo">
                  {work.map((w) => (
                    <InfoRow
                      key={w.id}
                      icon={<Briefcase size={17} className="text-slate-500" />}
                      primary={`${w.position} en ${w.company_name}`}
                      secondary={
                        w.is_current
                          ? "Trabajo actual"
                          : w.start_date
                            ? `${format(new Date(w.start_date), "MMM yyyy", { locale: es })} — ${w.end_date ? format(new Date(w.end_date), "MMM yyyy", { locale: es }) : "Presente"}`
                            : undefined
                      }
                    />
                  ))}
                </Section>
              )}

              {/* Education */}
              {education.length > 0 && (
                <Section title="Educación">
                  {education.map((e) => (
                    <InfoRow
                      key={e.id}
                      icon={
                        <GraduationCap size={17} className="text-slate-500" />
                      }
                      primary={e.school_name}
                      secondary={[e.degree, e.field_of_study]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </Section>
              )}

              {/* Places */}
              {places_lived.length > 0 && (
                <Section title="Lugares">
                  {places_lived.map((p) => (
                    <InfoRow
                      key={p.id}
                      icon={<MapPin size={17} className="text-slate-500" />}
                      primary={`${p.city}, ${p.country}`}
                      secondary={p.place_type}
                    />
                  ))}
                </Section>
              )}

              {/* Basic info */}
              <Section title="Detalles básicos">
                {user.birth_date && (
                  <InfoRow
                    icon={<Calendar size={17} className="text-slate-500" />}
                    primary={`Cumpleaños: ${format(new Date(user.birth_date), "d 'de' MMMM", { locale: es })}`}
                  />
                )}
                {user.relationship_status && (
                  <InfoRow
                    icon={<Heart size={17} className="text-slate-500" />}
                    primary={user.relationship_status}
                  />
                )}
                {user.website && (
                  <InfoRow
                    icon={<Globe size={17} className="text-slate-500" />}
                    primary={
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {user.website}
                      </a>
                    }
                  />
                )}
                <InfoRow
                  icon={<Calendar size={17} className="text-slate-500" />}
                  primary={`Se unió en ${format(new Date(user.created_at), "MMMM yyyy", { locale: es })}`}
                />
              </Section>

              {/* Interests */}
              {interests.length > 0 && (
                <Section title="Intereses">
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest.id}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                      >
                        {interest.interest_name}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </TabPanel>

          {/* ── Friends tab ───────────────────────────────────────────── */}
          <TabPanel value="friends">
            <FriendsTab userId={userId} />
          </TabPanel>

          {/* ── Photos tab ────────────────────────────────────────────── */}
          <TabPanel value="photos">
            <PhotosTab userId={userId} />
          </TabPanel>
        </Tabs>
      </div>

      {/* ── Edit profile modal ──────────────────────────────────────── */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntroCard({
  user,
  work,
  education,
  places,
  isOwnProfile,
}: {
  user: any;
  work: any[];
  education: any[];
  places: any[];
  isOwnProfile: boolean;
}) {
  return (
    <div className="surface p-4 space-y-3">
      <h3 className="font-bold text-slate-800 dark:text-slate-100">
        Introducción
      </h3>
      {user.bio && (
        <p className="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">
          {user.bio}
        </p>
      )}
      {work[0] && (
        <InfoRow
          icon={<Briefcase size={16} className="text-slate-500" />}
          primary={
            <span className="text-sm">
              <span className="text-slate-500">Trabaja en </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {work[0].company_name}
              </span>
            </span>
          }
        />
      )}
      {education[0] && (
        <InfoRow
          icon={<GraduationCap size={16} className="text-slate-500" />}
          primary={
            <span className="text-sm">
              <span className="text-slate-500">Estudió en </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {education[0].school_name}
              </span>
            </span>
          }
        />
      )}
      {places[0] && (
        <InfoRow
          icon={<MapPin size={16} className="text-slate-500" />}
          primary={
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Vive en <span className="font-semibold">{places[0].city}</span>
            </span>
          }
        />
      )}
      {isOwnProfile && (
        <Button variant="secondary" className="w-full" size="sm">
          Editar detalles
        </Button>
      )}
    </div>
  );
}

function FriendsTab({ userId }: { userId: string }) {
  const { data: friends, loading } = useApi(
    () => friendsApi.getFriends({ limit: 24 }),
    [userId],
  );

  return (
    <div className="surface p-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        Amigos
        {friends && (
          <span className="text-slate-400 font-normal text-base ml-2">
            · {friends.length}
          </span>
        )}
      </h2>
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-3 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      )}
      {!loading && friends?.length === 0 && (
        <EmptyState title="Sin amigos aún" description="¡Empieza a conectar!" />
      )}
      {!loading && friends && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {friends.map((f) => (
            <Link
              key={f.id}
              href={`/profile/${f.id}`}
              className="group text-center space-y-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-700">
                {f.profile_picture_url ? (
                  <img
                    src={f.profile_picture_url}
                    alt={f.full_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar fallbackName={f.full_name} size="lg" />
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {f.full_name}
              </p>
              {(f.mutual_friends_count ?? 0) > 0 && (
                <p className="text-xs text-slate-400">
                  {f.mutual_friends_count ?? 0} en común
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotosTab({ userId }: { userId: string }) {
  const { data: photos, loading } = useApi(
    () => albumsApi.getUserProfilePhotos(userId, { limit: 50 }),
    [userId],
  );

  return (
    <div className="surface p-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        Fotos
      </h2>
      {loading && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      )}
      {!loading && (photos?.length ?? 0) === 0 && (
        <EmptyState
          title="Sin fotos"
          description="No hay fotos públicas en este perfil."
        />
      )}
      {!loading && photos && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-700 group cursor-pointer"
            >
              <img
                src={p.url}
                alt={p.caption ?? ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditProfileModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
}) {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    bio: user.bio ?? "",
    website: user.website ?? "",
    location_city: user.location_city ?? "",
    location_country: user.location_country ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile(form);
      updateUser(updated);
      toast.success("Perfil actualizado");
      onClose();
    } catch {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const change = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre completo
          </label>
          <input
            className="input-base"
            value={form.full_name}
            onChange={(e) => change("full_name", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Biografía
          </label>
          <textarea
            className="input-base resize-none"
            rows={3}
            maxLength={200}
            value={form.bio}
            onChange={(e) => change("bio", e.target.value)}
            placeholder="Cuéntale al mundo sobre ti..."
          />
          <p className="text-xs text-slate-400 text-right">
            {form.bio.length}/200
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Sitio web
          </label>
          <input
            className="input-base"
            type="url"
            placeholder="https://tusitio.com"
            value={form.website}
            onChange={(e) => change("website", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ciudad
            </label>
            <input
              className="input-base"
              value={form.location_city}
              onChange={(e) => change("location_city", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              País
            </label>
            <input
              className="input-base"
              value={form.location_country}
              onChange={(e) => change("location_country", e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  primary,
  secondary,
}: {
  icon?: React.ReactNode;
  primary: React.ReactNode;
  secondary?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          {primary}
        </div>
        {secondary && (
          <p className="text-xs text-slate-400 mt-0.5">{secondary}</p>
        )}
      </div>
    </div>
  );
}

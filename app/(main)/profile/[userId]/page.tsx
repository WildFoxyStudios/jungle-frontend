"use client";

import { useState, use, useRef, useCallback } from "react";
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
  Plus,
  Trash2,
  Phone,
  Mail,
  Link as LinkIcon,
  Search,
  Filter,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api-profile";
import { postsApi } from "@/lib/api-posts";
import { friendsApi } from "@/lib/api-friends";
import { albumsApi } from "@/lib/api-albums";
import { useApi, useInfiniteApi, useMutation } from "@/hooks/useApi";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Dropdown } from "@/components/ui/dropdown";
import { PostCard } from "@/components/feed/post-card";
import { PostSkeleton, ProfileSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { uploadApi } from "@/lib/api-upload";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RichContent } from "@/components/ui/rich-content";
import { ProfileSection, ProfileItem } from "@/components/ui/profile-section";
import { Lightbox } from "@/components/ui/lightbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type FriendshipState = "none" | "pending_sent" | "pending_received" | "friends";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: me } = useAuth();
  const toast = useToast();
  const isOwnProfile = me?.id === userId;

  const { data: profile, loading: loadingProfile, refresh } = useApi(() => profileApi.getProfile(userId), [userId]);
  const { items: posts, loading: loadingPosts, loadingMore, hasMore, loadMore } = useInfiniteApi(
    (offset, limit) => postsApi.getUserPosts(userId, limit, offset), [userId], 12,
  );
  const { data: photos, loading: loadingPhotos } = useApi(() => albumsApi.getUserProfilePhotos(userId, { limit: 9 }), [userId]);

  const [friendship, setFriendship] = useState<FriendshipState>("none");
  const { execute: sendReq, loading: sendingReq } = useMutation(() => friendsApi.sendRequest(userId));
  const { execute: unfriend } = useMutation(() => friendsApi.unfriend(userId));

  const handleFriendAction = async () => {
    if (friendship === "none") { await sendReq(); setFriendship("pending_sent"); toast.success("Solicitud enviada"); }
    else if (friendship === "friends") { await unfriend(); setFriendship("none"); toast.info("Ya no son amigos"); }
  };

  const [editOpen, setEditOpen] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useInfiniteScroll({ onLoadMore: loadMore, hasMore, loading: loadingMore });

  // Work/Education/Place modals
  const [addWorkOpen, setAddWorkOpen] = useState(false);
  const [addEduOpen, setAddEduOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [addInterestOpen, setAddInterestOpen] = useState(false);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingProfile(true);
    try { const r = await uploadApi.uploadProfilePicture(file); await profileApi.updateProfilePicture(r.url); toast.success("Foto actualizada"); refresh(); }
    catch { toast.error("Error al subir foto"); }
    finally { setUploadingProfile(false); if (profileInputRef.current) profileInputRef.current.value = ""; }
  };

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true);
    try { const r = await uploadApi.uploadCoverPhoto(file); await profileApi.updateCoverPhoto(r.url); toast.success("Portada actualizada"); refresh(); }
    catch { toast.error("Error al subir portada"); }
    finally { setUploadingCover(false); if (coverInputRef.current) coverInputRef.current.value = ""; }
  };

  if (loadingProfile) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-4 space-y-4">
        <ProfileSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <div className="md:col-span-2 space-y-4">{Array.from({ length: 2 }).map((_, i) => <PostSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  if (!profile) return <EmptyState title="Perfil no encontrado" description="Este usuario no existe o su cuenta está desactivada." className="min-h-[60vh]" />;

  const { user, stats, education, work, places_lived, interests } = profile;
  const photosList = photos ?? [];

  return (
    <div className="max-w-[900px] mx-auto pb-20">
      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="relative h-[180px] sm:h-[250px] md:h-[320px] bg-gradient-to-br from-indigo-400 to-purple-600 rounded-b-2xl overflow-hidden">
          {user.cover_photo_url ? (
            <Image src={user.cover_photo_url} alt="Portada" fill sizes="(max-width: 900px) 100vw, 900px" className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          {isOwnProfile && (
            <>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPhotoChange} />
              <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white transition-colors shadow disabled:opacity-50 cursor-pointer">
                <Camera size={15} />{uploadingCover ? "Subiendo..." : <span className="hidden sm:inline">Editar portada</span>}
              </button>
            </>
          )}
        </div>

        {/* Avatar + Name — Facebook style: centered on mobile, left-aligned on desktop */}
        <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-4 px-4 -mt-16 sm:-mt-12 relative z-10">
          <div className="relative shrink-0">
            <div className="w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-slate-200 dark:bg-gray-800 shadow-xl">
              {user.profile_picture_url ? (
                <Image src={user.profile_picture_url} alt={user.full_name ?? user.username} fill sizes="150px" className="object-cover" />
              ) : (
                <Avatar alt={user.full_name} size="2xl" fallbackName={user.full_name ?? user.username} />
              )}
            </div>
            {isOwnProfile && (
              <>
                <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                <button onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 transition-colors disabled:opacity-50">
                  <Camera size={16} className="text-slate-600 dark:text-slate-300" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:flex-row sm:justify-between gap-3 pb-2 sm:pb-3 text-center sm:text-left">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">{user.full_name ?? user.username}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">@{user.username}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                <Link href="#friends" className="hover:underline">{stats.friends_count} amigos</Link> · {stats.posts_count} publicaciones
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <Button variant="secondary" leftIcon={<Edit3 size={15} />} onClick={() => setEditOpen(true)} size="sm">Editar perfil</Button>
              ) : (
                <>
                  {friendship === "friends" ? (
                    <Button variant="secondary" leftIcon={<UserCheck size={15} />} size="sm" onClick={handleFriendAction}>Amigos</Button>
                  ) : friendship === "pending_sent" ? (
                    <Button variant="ghost" leftIcon={<UserMinus size={15} />} size="sm" onClick={handleFriendAction}>Solicitud enviada</Button>
                  ) : (
                    <Button leftIcon={<UserPlus size={15} />} size="sm" loading={sendingReq} onClick={handleFriendAction}>Agregar</Button>
                  )}
                  <Link href={`/messages?user=${userId}`}><Button variant="secondary" leftIcon={<MessageCircle size={15} />} size="sm">Mensaje</Button></Link>
                  <Dropdown trigger={<button className="p-2 rounded-lg bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"><MoreHorizontal size={18} className="text-slate-600 dark:text-slate-300" /></button>}
                    items={[{ label: "Reportar", icon: <Flag size={15} />, onClick: () => toast.info("Reporte enviado"), danger: true }]} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs (sticky) ──────────────────────────────────────────────── */}
      <div className="mt-2 px-4">
        <Tabs defaultTab="posts">
          <div className="surface mb-4 sticky top-14 z-20">
            <TabList className="px-2">
              <Tab value="posts">Publicaciones</Tab>
              <Tab value="about">Información</Tab>
              <Tab value="friends">Amigos</Tab>
              <Tab value="photos">Fotos</Tab>
            </TabList>
          </div>

          {/* ── Posts ─────────────────────────────────────────────── */}
          <TabPanel value="posts">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <IntroCard user={user} work={work} education={education} places={places_lived} isOwnProfile={isOwnProfile} />
                {photosList.length > 0 && (
                  <div className="surface p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">Fotos</h3>
                      <span className="text-sm text-indigo-600 dark:text-indigo-400">{photosList.length}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {photosList.slice(0, 9).map((p) => (
                        <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-gray-700">
                          <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-4">
                {loadingPosts && Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
                {!loadingPosts && posts.length === 0 && <EmptyState title="Sin publicaciones" description={isOwnProfile ? "Comparte algo con tus amigos." : "Este usuario no tiene publicaciones."} />}
                {posts.map((post) => <PostCard key={post.id} post={{ ...post, user_name: post.user_name || profile?.user?.full_name || profile?.user?.username, user_profile_picture: post.user_profile_picture || profile?.user?.profile_picture_url }} />)}
                {loadingMore && <PostSkeleton />}
                <div ref={sentinelRef} className="h-1" />
              </div>
            </div>
          </TabPanel>

          {/* ── About ────────────────────────────────────────────── */}
          <TabPanel value="about">
            <AboutTab user={user} work={work} education={education} places={places_lived} interests={interests}
              isOwnProfile={isOwnProfile} onRefresh={refresh}
              onAddWork={() => setAddWorkOpen(true)} onAddEdu={() => setAddEduOpen(true)}
              onAddPlace={() => setAddPlaceOpen(true)} onAddInterest={() => setAddInterestOpen(true)} />
          </TabPanel>

          {/* ── Friends ──────────────────────────────────────────── */}
          <TabPanel value="friends"><FriendsTab userId={userId} /></TabPanel>

          {/* ── Photos ───────────────────────────────────────────── */}
          <TabPanel value="photos"><PhotosTab userId={userId} /></TabPanel>
        </Tabs>
      </div>

      {/* Modals */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} onSaved={refresh} />
      <AddWorkModal open={addWorkOpen} onClose={() => setAddWorkOpen(false)} onSaved={refresh} />
      <AddEducationModal open={addEduOpen} onClose={() => setAddEduOpen(false)} onSaved={refresh} />
      <AddPlaceModal open={addPlaceOpen} onClose={() => setAddPlaceOpen(false)} onSaved={refresh} />
      <AddInterestModal open={addInterestOpen} onClose={() => setAddInterestOpen(false)} onSaved={refresh} />
    </div>
  );
}

// ─── Intro Card ───────────────────────────────────────────────────────────────

function IntroCard({ user, work, education, places, isOwnProfile }: { user: any; work: any[]; education: any[]; places: any[]; isOwnProfile: boolean }) {
  return (
    <div className="surface p-4 space-y-3">
      <h3 className="font-bold text-slate-800 dark:text-slate-100">Introducción</h3>
      {user.bio && <p className="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed"><RichContent content={user.bio} /></p>}
      {work[0] && <InfoRow icon={<Briefcase size={16} className="text-slate-500" />} primary={<span className="text-sm"><span className="text-slate-500">Trabaja en </span><span className="font-semibold text-slate-800 dark:text-slate-100">{work[0].company_name}</span></span>} />}
      {education[0] && <InfoRow icon={<GraduationCap size={16} className="text-slate-500" />} primary={<span className="text-sm"><span className="text-slate-500">Estudió en </span><span className="font-semibold text-slate-800 dark:text-slate-100">{education[0].school_name}</span></span>} />}
      {places[0] && <InfoRow icon={<MapPin size={16} className="text-slate-500" />} primary={<span className="text-sm text-slate-700 dark:text-slate-300">Vive en <span className="font-semibold">{places[0].city}</span></span>} />}
      {isOwnProfile && <Button variant="secondary" className="w-full" size="sm">Editar detalles</Button>}
    </div>
  );
}

// ─── About Tab (Facebook style) ──────────────────────────────────────────────

function AboutTab({ user, work, education, places, interests, isOwnProfile, onRefresh, onAddWork, onAddEdu, onAddPlace, onAddInterest }: {
  user: any; work: any[]; education: any[]; places: any[]; interests: any[];
  isOwnProfile: boolean; onRefresh: () => void;
  onAddWork: () => void; onAddEdu: () => void; onAddPlace: () => void; onAddInterest: () => void;
}) {
  const toast = useToast();

  const handleDeleteWork = async (id: string) => {
    try { await profileApi.deleteWork(id); onRefresh(); toast.success("Eliminado"); } catch { toast.error("Error"); }
  };
  const handleDeleteEdu = async (id: string) => {
    try { await profileApi.deleteEducation(id); onRefresh(); toast.success("Eliminado"); } catch { toast.error("Error"); }
  };
  const handleDeletePlace = async (id: string) => {
    try { await profileApi.deletePlace(id); onRefresh(); toast.success("Eliminado"); } catch { toast.error("Error"); }
  };
  const handleDeleteInterest = async (id: string) => {
    try { await profileApi.deleteInterest(id); onRefresh(); toast.success("Eliminado"); } catch { toast.error("Error"); }
  };

  return (
    <div className="space-y-4 max-w-[640px]">
      {/* Bio */}
      {user.bio && (
        <ProfileSection title="Sobre mí" icon={<Globe size={18} />} editable={false}>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"><RichContent content={user.bio} /></p>
        </ProfileSection>
      )}

      {/* Work */}
      <ProfileSection title="Trabajo" icon={<Briefcase size={18} />} onAdd={isOwnProfile ? onAddWork : undefined} addLabel="Agregar trabajo"
        isEmpty={work.length === 0} emptyText="Sin experiencia laboral">
        {work.map((w) => (
          <ProfileItem key={w.id} icon={<Briefcase size={16} className="text-slate-400" />}
            primary={<><span className="font-semibold">{w.position}</span> en {w.company_name}</>}
            secondary={w.is_current ? "Trabajo actual" : w.start_date ? `${format(new Date(w.start_date), "MMM yyyy", { locale: es })} — ${w.end_date ? format(new Date(w.end_date), "MMM yyyy", { locale: es }) : "Presente"}` : undefined}
            onDelete={isOwnProfile ? () => handleDeleteWork(w.id) : undefined}
          />
        ))}
      </ProfileSection>

      {/* Education */}
      <ProfileSection title="Educación" icon={<GraduationCap size={18} />} onAdd={isOwnProfile ? onAddEdu : undefined} addLabel="Agregar educación"
        isEmpty={education.length === 0} emptyText="Sin educación registrada">
        {education.map((e) => (
          <ProfileItem key={e.id} icon={<GraduationCap size={16} className="text-slate-400" />}
            primary={e.school_name}
            secondary={[e.degree, e.field_of_study].filter(Boolean).join(" · ")}
            onDelete={isOwnProfile ? () => handleDeleteEdu(e.id) : undefined}
          />
        ))}
      </ProfileSection>

      {/* Places */}
      <ProfileSection title="Lugares donde has vivido" icon={<MapPin size={18} />} onAdd={isOwnProfile ? onAddPlace : undefined} addLabel="Agregar lugar"
        isEmpty={places.length === 0} emptyText="Sin lugares registrados">
        {places.map((p) => (
          <ProfileItem key={p.id} icon={<MapPin size={16} className="text-slate-400" />}
            primary={`${p.city}, ${p.country}`}
            secondary={p.place_type === "current" ? "Ciudad actual" : p.place_type === "hometown" ? "Ciudad natal" : p.place_type}
            onDelete={isOwnProfile ? () => handleDeletePlace(p.id) : undefined}
          />
        ))}
      </ProfileSection>

      {/* Basic info */}
      <ProfileSection title="Información básica" icon={<Calendar size={18} />} editable={false}>
        {user.birth_date && <ProfileItem icon={<Calendar size={16} className="text-slate-400" />} primary={`Cumpleaños: ${format(new Date(user.birth_date), "d 'de' MMMM", { locale: es })}`} />}
        {user.relationship_status && <ProfileItem icon={<Heart size={16} className="text-slate-400" />} primary={user.relationship_status} />}
        {user.website && <ProfileItem icon={<LinkIcon size={16} className="text-slate-400" />} primary={<a href={user.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{user.website}</a>} />}
        {user.phone_number && <ProfileItem icon={<Phone size={16} className="text-slate-400" />} primary={user.phone_number} />}
        {user.email && <ProfileItem icon={<Mail size={16} className="text-slate-400" />} primary={user.email} />}
        <ProfileItem icon={<Calendar size={16} className="text-slate-400" />} primary={`Se unió en ${format(new Date(user.created_at), "MMMM yyyy", { locale: es })}`} />
      </ProfileSection>

      {/* Interests */}
      <ProfileSection title="Intereses" icon={<Heart size={18} />} onAdd={isOwnProfile ? onAddInterest : undefined} addLabel="Agregar"
        isEmpty={interests.length === 0} emptyText="Sin intereses registrados">
        <div className="flex flex-wrap gap-2">
          {interests.map((interest: any) => (
            <span key={interest.id} className="group relative px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              {interest.interest_name}
              {isOwnProfile && (
                <button onClick={() => handleDeleteInterest(interest.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
      </ProfileSection>
    </div>
  );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

function FriendsTab({ userId }: { userId: string }) {
  const { data: friends, loading } = useApi(() => friendsApi.getFriends({ limit: 50 }), [userId]);
  const [search, setSearch] = useState("");

  const filtered = search
    ? friends?.filter((f) => f.full_name?.toLowerCase().includes(search.toLowerCase()) || f.username?.toLowerCase().includes(search.toLowerCase()))
    : friends;

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Amigos{friends && <span className="text-slate-400 font-normal text-base ml-2">· {friends.length}</span>}
        </h2>
      </div>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input type="search" placeholder="Buscar amigos..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9 w-full" />
      </div>
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="space-y-2"><Skeleton className="aspect-square rounded-xl" /><Skeleton className="h-3 w-3/4 mx-auto" /></div>)}
        </div>
      )}
      {!loading && (!filtered || filtered.length === 0) && <EmptyState title={search ? "Sin resultados" : "Sin amigos aún"} description={search ? "No se encontraron amigos con ese nombre." : "¡Empieza a conectar!"} />}
      {!loading && filtered && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((f) => (
            <Link key={f.id} href={`/profile/${f.id}`} className="group text-center space-y-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-700">
                {f.profile_picture_url ? (
                  <img src={f.profile_picture_url} alt={f.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Avatar fallbackName={f.full_name} size="lg" /></div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{f.full_name}</p>
              {(f.mutual_friends_count ?? 0) > 0 && <p className="text-xs text-slate-400">{f.mutual_friends_count} en común</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────

function PhotosTab({ userId }: { userId: string }) {
  const { data: photos, loading } = useApi(() => albumsApi.getUserProfilePhotos(userId, { limit: 50 }), [userId]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openPhoto = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

  const lightboxImages = (photos ?? []).map((p) => ({ url: p.url, caption: p.caption ?? undefined }));

  return (
    <div className="surface p-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Fotos</h2>
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      )}
      {!loading && (!photos || photos.length === 0) && <EmptyState title="Sin fotos" description="No hay fotos públicas en este perfil." />}
      {!loading && photos && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => openPhoto(i)} className="aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-gray-700 group cursor-pointer">
              <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <Lightbox images={lightboxImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({ open, onClose, user, onSaved }: { open: boolean; onClose: () => void; user: any; onSaved: () => void }) {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user.full_name ?? "", bio: user.bio ?? "", website: user.website ?? "",
    location_city: user.location_city ?? "", location_country: user.location_country ?? "",
    birth_date: user.birth_date ?? "", gender: user.gender ?? "", relationship_status: user.relationship_status ?? "",
  });

  const change = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try { const updated = await profileApi.updateProfile(form); updateUser(updated); toast.success("Perfil actualizado"); onSaved(); onClose(); }
    catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" size="md" footer={
      <><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} loading={saving}>Guardar</Button></>
    }>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre completo</label>
          <input className="input-base" value={form.full_name} onChange={(e) => change("full_name", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Biografía</label>
          <textarea className="input-base resize-none" rows={3} maxLength={200} value={form.bio} onChange={(e) => change("bio", e.target.value)} placeholder="Cuéntale al mundo sobre ti..." />
          <p className="text-xs text-slate-400 text-right">{form.bio.length}/200</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sitio web</label>
          <input className="input-base" type="url" placeholder="https://tusitio.com" value={form.website} onChange={(e) => change("website", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciudad</label>
            <input className="input-base" value={form.location_city} onChange={(e) => change("location_city", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">País</label>
            <input className="input-base" value={form.location_country} onChange={(e) => change("location_country", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de nacimiento</label>
            <input className="input-base" type="date" value={form.birth_date} onChange={(e) => change("birth_date", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Género</label>
            <select className="input-base cursor-pointer" value={form.gender} onChange={(e) => change("gender", e.target.value)}>
              <option value="">Prefiero no decir</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado sentimental</label>
          <select className="input-base cursor-pointer" value={form.relationship_status} onChange={(e) => change("relationship_status", e.target.value)}>
            <option value="">Prefiero no decir</option>
            <option value="Soltero/a">Soltero/a</option>
            <option value="En una relación">En una relación</option>
            <option value="Comprometido/a">Comprometido/a</option>
            <option value="Casado/a">Casado/a</option>
            <option value="Es complicado">Es complicado</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Work Modal ───────────────────────────────────────────────────────────

function AddWorkModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company_name: "", position: "", location: "", start_date: "", end_date: "", is_current: false, description: "" });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.company_name.trim() || !form.position.trim()) return;
    setSaving(true);
    try {
      await profileApi.addWork({ ...form, company_name: form.company_name.trim(), position: form.position.trim(), start_date: form.start_date || undefined, end_date: form.is_current ? undefined : form.end_date || undefined });
      toast.success("Trabajo agregado"); onSaved(); onClose();
      setForm({ company_name: "", position: "", location: "", start_date: "", end_date: "", is_current: false, description: "" });
    } catch { toast.error("Error al agregar"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar trabajo" size="md" footer={
      <><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} loading={saving} disabled={!form.company_name.trim() || !form.position.trim()}>Guardar</Button></>
    }>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa *</label><input className="input-base" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Nombre de la empresa" autoFocus /></div>
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cargo *</label><input className="input-base" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Tu cargo o puesto" /></div>
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciudad</label><input className="input-base" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Ciudad" /></div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.is_current} onChange={(e) => set("is_current", e.target.checked)} className="rounded" /> Trabajo actual
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha inicio</label><input className="input-base" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
          {!form.is_current && <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha fin</label><input className="input-base" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></div>}
        </div>
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label><textarea className="input-base resize-none" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe tu rol..." /></div>
      </div>
    </Modal>
  );
}

// ─── Add Education Modal ──────────────────────────────────────────────────────

function AddEducationModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ school_name: "", degree: "", field_of_study: "", start_year: "", end_year: "", is_current: false, description: "" });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.school_name.trim()) return;
    setSaving(true);
    try {
      await profileApi.addEducation({ school_name: form.school_name.trim(), degree: form.degree || undefined, field_of_study: form.field_of_study || undefined,
        start_year: form.start_year ? parseInt(form.start_year) : undefined, end_year: form.end_year ? parseInt(form.end_year) : undefined, is_current: form.is_current, description: form.description || undefined });
      toast.success("Educación agregada"); onSaved(); onClose();
      setForm({ school_name: "", degree: "", field_of_study: "", start_year: "", end_year: "", is_current: false, description: "" });
    } catch { toast.error("Error al agregar"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar educación" size="md" footer={
      <><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} loading={saving} disabled={!form.school_name.trim()}>Guardar</Button></>
    }>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Escuela / Universidad *</label><input className="input-base" value={form.school_name} onChange={(e) => set("school_name", e.target.value)} placeholder="Nombre de la institución" autoFocus /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Título</label><input className="input-base" value={form.degree} onChange={(e) => set("degree", e.target.value)} placeholder="Ej: Licenciatura" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Campo de estudio</label><input className="input-base" value={form.field_of_study} onChange={(e) => set("field_of_study", e.target.value)} placeholder="Ej: Ingeniería" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.is_current} onChange={(e) => set("is_current", e.target.checked)} className="rounded" /> Estudio actual
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Año inicio</label><input className="input-base" type="number" min="1950" max="2030" value={form.start_year} onChange={(e) => set("start_year", e.target.value)} placeholder="2020" /></div>
          {!form.is_current && <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Año fin</label><input className="input-base" type="number" min="1950" max="2030" value={form.end_year} onChange={(e) => set("end_year", e.target.value)} placeholder="2024" /></div>}
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Place Modal ──────────────────────────────────────────────────────────

function AddPlaceModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ city: "", country: "", place_type: "current" as string });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.city.trim() || !form.country.trim()) return;
    setSaving(true);
    try {
      await profileApi.addPlace({ city: form.city.trim(), country: form.country.trim(), place_type: form.place_type });
      toast.success("Lugar agregado"); onSaved(); onClose();
      setForm({ city: "", country: "", place_type: "current" });
    } catch { toast.error("Error al agregar"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar lugar" size="sm" footer={
      <><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} loading={saving} disabled={!form.city.trim() || !form.country.trim()}>Guardar</Button></>
    }>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ciudad *</label><input className="input-base" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ciudad" autoFocus /></div>
        <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-slate-700 dark:text-slate-300">País *</label><input className="input-base" value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="País" /></div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
          <select className="input-base cursor-pointer" value={form.place_type} onChange={(e) => set("place_type", e.target.value)}>
            <option value="current">Ciudad actual</option>
            <option value="hometown">Ciudad natal</option>
            <option value="previous">Ciudad anterior</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Interest Modal ───────────────────────────────────────────────────────

function AddInterestModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "general", interest_name: "" });

  const handleSave = async () => {
    if (!form.interest_name.trim()) return;
    setSaving(true);
    try {
      await profileApi.addInterest({ category: form.category, interest_name: form.interest_name.trim() });
      toast.success("Interés agregado"); onSaved(); onClose();
      setForm({ category: "general", interest_name: "" });
    } catch { toast.error("Error al agregar"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar interés" size="sm" footer={
      <><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} loading={saving} disabled={!form.interest_name.trim()}>Agregar</Button></>
    }>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoría</label>
          <select className="input-base cursor-pointer" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="general">General</option>
            <option value="music">Música</option>
            <option value="sports">Deportes</option>
            <option value="movies">Películas</option>
            <option value="books">Libros</option>
            <option value="food">Comida</option>
            <option value="travel">Viajes</option>
            <option value="technology">Tecnología</option>
            <option value="art">Arte</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Interés *</label>
          <input className="input-base" value={form.interest_name} onChange={(e) => setForm((p) => ({ ...p, interest_name: e.target.value }))} placeholder="Ej: Fotografía, Fútbol, Rock..." autoFocus />
        </div>
      </div>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, primary, secondary }: { icon?: React.ReactNode; primary: React.ReactNode; secondary?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div>
        <div className="text-sm text-slate-700 dark:text-slate-200">{primary}</div>
        {secondary && <p className="text-xs text-slate-400 mt-0.5">{secondary}</p>}
      </div>
    </div>
  );
}

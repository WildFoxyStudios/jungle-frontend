"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Smile,
  MapPin,
  Users,
  Globe,
  Lock,
  ChevronDown,
  X,
  UserPlus,
  Loader2,
  Trash2,
  BarChart3,
  Plus,
  BadgeDollarSign,
  Crown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi } from "@/lib/api-posts";
import { uploadApi } from "@/lib/api-upload";
import { pollsApi } from "@/lib/api-polls";
import { friendsApi } from "@/lib/api-friends";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { ImageUploaderEditor } from "@/components/media/ImageUploaderEditor";
import { VideoUploaderEditor } from "@/components/media/VideoUploaderEditor";
import type { ImageSizes } from "@/lib/image-compression";
import { MentionInput } from "@/components/ui/mention-input";

const FEELINGS = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😍", label: "Enamorado/a" },
  { emoji: "🥳", label: "Celebrando" },
  { emoji: "😎", label: "Genial" },
  { emoji: "😢", label: "Triste" },
  { emoji: "😡", label: "Enojado/a" },
  { emoji: "🤩", label: "Emocionado/a" },
  { emoji: "😴", label: "Cansado/a" },
  { emoji: "🤒", label: "Enfermo/a" },
  { emoji: "🥰", label: "Agradecido/a" },
  { emoji: "😋", label: "Hambriento/a" },
  { emoji: "🤗", label: "Bendecido/a" },
];

const VISIBILITIES = [
  { value: "public", label: "Público", icon: Globe, desc: "Cualquiera puede ver esta publicación" },
  { value: "friends", label: "Amigos", icon: Users, desc: "Solo tus amigos" },
  { value: "only_me", label: "Solo yo", icon: Lock, desc: "Solo tú puedes ver" },
];

interface CreatePostProps {
  onCreated?: (post: Post) => void;
  groupId?: string;
}

export function CreatePost({ onCreated, groupId }: CreatePostProps) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Estados principales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "only_me">("friends");
  const [loading, setLoading] = useState(false);

  // Estados de medios
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Estados de feeling
  const [feeling, setFeeling] = useState<{ emoji: string; label: string } | null>(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);

  // Estados de ubicación
  const [location, setLocation] = useState<{ name: string; lat?: number; lng?: number } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Estados de etiquetar personas
  const [taggedFriends, setTaggedFriends] = useState<Array<{ id: string; name: string; picture?: string }>>([]);
  const [showTagFriends, setShowTagFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<Array<{ id: string; full_name: string; profile_picture_url?: string }>>([]);
  const [searchingFriends, setSearchingFriends] = useState(false);

  // Estados de encuestas
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState(7); // días

  // Estados de monetización
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("5.00");
  const [showPaidSettings, setShowPaidSettings] = useState(false);
  const [isSubscribersOnly, setIsSubscribersOnly] = useState(false);

  // Buscar amigos
  const searchFriends = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFriendSearchResults([]);
      return;
    }
    setSearchingFriends(true);
    try {
      const friends = await friendsApi.getFriends();
      const filtered = friends.filter(f => 
        f.full_name.toLowerCase().includes(query.toLowerCase())
      );
      setFriendSearchResults(filtered);
    } catch (error) {
      toast.error("Error al buscar amigos");
    } finally {
      setSearchingFriends(false);
    }
  }, [toast]);

  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const locationName = data.display_name || "Ubicación actual";
          setLocation({
            name: locationName.split(",")[0],
            lat: latitude,
            lng: longitude
          });
          setShowLocationPicker(false);
          toast.success("Ubicación añadida");
        } catch {
          setLocation({
            name: "Ubicación actual",
            lat: latitude,
            lng: longitude
          });
          setShowLocationPicker(false);
        }
        setGettingLocation(false);
      },
      (error) => {
        toast.error("Error al obtener ubicación: " + error.message);
        setGettingLocation(false);
      }
    );
  };

  // Manejar selección de archivos - abre editor automáticamente
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tipo de archivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (file.type.startsWith("image/") && validImageTypes.includes(file.type)) {
      setPendingFile(file);
      setShowImageEditor(true);
    } else if (file.type.startsWith("video/") && validVideoTypes.includes(file.type)) {
      setPendingFile(file);
      setShowVideoEditor(true);
    } else {
      toast.error("Tipo de archivo no soportado");
    }

    e.target.value = "";
  };

  // Procesar imagen editada
  const handleImageProcessed = (sizes: ImageSizes) => {
    setMediaFiles(prev => [...prev, sizes.original]);
    const url = URL.createObjectURL(sizes.original);
    setMediaPreviews(prev => [...prev, url]);
    setShowImageEditor(false);
    setPendingFile(null);
    toast.success("Imagen agregada");
  };

  // Procesar video editado
  const handleVideoProcessed = (result: {
    videoFile: File;
    thumbnailFile: File;
    originalSize: number;
    processedSize: number;
    duration: number;
  }) => {
    setMediaFiles(prev => [...prev, result.videoFile]);
    const url = URL.createObjectURL(result.videoFile);
    setMediaPreviews(prev => [...prev, url]);
    setShowVideoEditor(false);
    setPendingFile(null);
    toast.success("Video agregado");
  };

  // Eliminar medio
  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  // Abrir modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    if (loading) return;
    setIsModalOpen(false);
    setContent("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setFeeling(null);
    setLocation(null);
    setTaggedFriends([]);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowFeelingPicker(false);
    setShowVisibilityPicker(false);
    setShowLocationPicker(false);
    setShowTagFriends(false);
    setShowPollCreator(false);
    setIsPaid(false);
    setPrice("5.00");
    setShowPaidSettings(false);
    setIsSubscribersOnly(false);
  };

  // Agregar opción a la encuesta
  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  // Eliminar opción de la encuesta
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Actualizar opción de la encuesta
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Publicar
  const handleSubmit = async () => {
    const hasPoll = pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2;
    if (!content.trim() && mediaFiles.length === 0 && !hasPoll) {
      toast.error("Escribe algo, agrega una foto/video o crea una encuesta");
      return;
    }

    setLoading(true);
    try {
      let media_urls: string[] = [];
      if (mediaFiles.length > 0) {
        const uploaded = await uploadApi.uploadPostMedia(mediaFiles);
        media_urls = uploaded.map(u => u.url);
      }

      // Preparar datos de la encuesta si existe
      let poll_data = undefined;
      if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
        poll_data = {
          question: pollQuestion.trim(),
          options: pollOptions.filter(o => o.trim()),
          duration_days: pollDuration,
        };
      }

      const post = await postsApi.createPost({
        content: content.trim(),
        media_urls,
        visibility,
        feeling: feeling ? `${feeling.emoji} ${feeling.label}` : undefined,
        tagged_users: taggedFriends.map(f => f.id),
        location: location?.name,
        location_lat: location?.lat,
        location_lng: location?.lng,
        group_id: groupId,
        poll: poll_data,
        is_paid: isPaid,
        price: isPaid ? parseFloat(price) : undefined,
        is_subscribers_only: isSubscribersOnly,
      });

      // Enrich post with user info and poll data for immediate feed display
      let pollData = undefined;
      if (poll_data) {
        // Fetch real poll data from backend to get proper UUIDs for options
        try {
          pollData = await pollsApi.getPostPoll(post.id);
        } catch {
          // Fallback: poll will load on next feed refresh
        }
      }

      const enrichedPost: Post = {
        ...post,
        user_name: user?.full_name || undefined,
        user_profile_picture: user?.profile_picture_url || undefined,
        ...(pollData ? { poll: pollData } : {}),
      };

      onCreated?.(enrichedPost);
      closeModal();
      toast.success("Publicación creada");
    } catch (error) {
      toast.error("Error al publicar");
    } finally {
      setLoading(false);
    }
  };

  const visConfig = VISIBILITIES.find(v => v.value === visibility) ?? VISIBILITIES[1];
  const VisibilityIcon = visConfig.icon;

  return (
    <>
      {/* Vista compacta - Trigger */}
      <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.profile_picture_url}
            alt={user?.full_name}
            size="md"
            fallbackName={user?.full_name}
          />
          <button
            onClick={openModal}
            className="flex-1 bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6e9] dark:hover:bg-[#4e4f50] rounded-full px-4 py-2.5 text-left text-[#65676b] dark:text-[#b0b3b8] transition-colors"
          >
            ¿Qué estás pensando, {user?.full_name?.split(" ")[0]}?
          </button>
        </div>

        <div className="flex items-center justify-around mt-3 pt-3 border-t border-[#ced0d4] dark:border-[#3e4042]">
          <button
            onClick={() => router.push('/live')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors flex-1 justify-center"
          >
            <VideoIcon className="w-6 h-6 text-[#f3425f]" />
            <span className="text-[#65676b] dark:text-[#b0b3b8] font-semibold text-sm">Video en vivo</span>
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors flex-1 justify-center"
          >
            <ImageIcon className="w-6 h-6 text-[#45bd62]" />
            <span className="text-[#65676b] dark:text-[#b0b3b8] font-semibold text-sm">Foto/video</span>
          </button>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors flex-1 justify-center"
          >
            <Smile className="w-6 h-6 text-[#f7b928]" />
            <span className="text-[#65676b] dark:text-[#b0b3b8] font-semibold text-sm">Sentimiento/actividad</span>
          </button>
        </div>
      </div>

      {/* Modal principal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Crear publicación"
        size="lg"
      >
        <div className="space-y-4">
          {/* Header con usuario y visibilidad */}
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.profile_picture_url}
              alt={user?.full_name}
              size="md"
              fallbackName={user?.full_name}
            />
            <div className="flex-1">
              <div className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                {user?.full_name}
                {feeling && (
                  <span className="text-[#65676b] dark:text-[#b0b3b8] font-normal">
                    {" "}está {feeling.emoji} {feeling.label}
                  </span>
                )}
                {taggedFriends.length > 0 && (
                  <span className="text-[#65676b] dark:text-[#b0b3b8] font-normal">
                    {" "}con{" "}
                    <span className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                      {taggedFriends.length === 1
                        ? taggedFriends[0].name
                        : `${taggedFriends.length} personas`}
                    </span>
                  </span>
                )}
                {location && (
                  <span className="text-[#65676b] dark:text-[#b0b3b8] font-normal">
                    {" "}en{" "}
                    <span className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                      {location.name}
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowVisibilityPicker(!showVisibilityPicker)}
                className="flex items-center gap-1 mt-1 px-3 py-1 bg-[#e4e6eb] dark:bg-[#3a3b3c] hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] rounded-md transition-colors"
              >
                <VisibilityIcon size={12} />
                <span className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                  {visConfig.label}
                </span>
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Selector de visibilidad */}
          {showVisibilityPicker && (
            <div className="bg-white dark:bg-[#242526] border border-[#ced0d4] dark:border-[#3e4042] rounded-lg p-2 space-y-1">
              {VISIBILITIES.map((vis) => {
                const Icon = vis.icon;
                return (
                  <button
                    key={vis.value}
                    onClick={() => {
                      setVisibility(vis.value as "public" | "friends" | "only_me");
                      setShowVisibilityPicker(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors",
                      visibility === vis.value && "bg-[#e7f3ff] dark:bg-[#263951]"
                    )}
                  >
                    <div className="w-10 h-10 bg-[#e4e6eb] dark:bg-[#3a3b3c] rounded-full flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm text-[#050505] dark:text-[#e4e6eb]">
                        {vis.label}
                      </div>
                      <div className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                        {vis.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Textarea with mention/hashtag autocomplete */}
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder={`¿Qué estás pensando, ${user?.full_name?.split(" ")[0]}?`}
            multiline
            rows={4}
            inputClassName="w-full min-h-[120px] text-[#050505] dark:text-[#e4e6eb] text-lg sm:text-2xl placeholder:text-[#65676b] dark:placeholder:text-[#b0b3b8] resize-none"
            autoFocus
          />

          {/* Preview de medios */}
          {mediaPreviews.length > 0 && (
            <div className="relative border border-[#ced0d4] dark:border-[#3e4042] rounded-lg overflow-hidden">
              <div className={cn(
                "grid gap-1",
                mediaPreviews.length === 1 && "grid-cols-1",
                mediaPreviews.length === 2 && "grid-cols-2",
                mediaPreviews.length >= 3 && "grid-cols-2"
              )}>
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-black">
                    {mediaFiles[index]?.type.startsWith("video/") ? (
                      <video
                        src={preview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white dark:bg-[#242526] rounded-full flex items-center justify-center hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar a tu publicación */}
          <div className="border border-[#ced0d4] dark:border-[#3e4042] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-[#050505] dark:text-[#e4e6eb]">
                Agregar a tu publicación
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-[#45bd62]" />
                </label>
                <button
                  onClick={() => setShowTagFriends(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <UserPlus className="w-6 h-6 text-[#1877f2]" />
                </button>
                <button
                  onClick={() => setShowFeelingPicker(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <Smile className="w-6 h-6 text-[#f7b928]" />
                </button>
                <button
                  onClick={() => setShowLocationPicker(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <MapPin className="w-6 h-6 text-[#f3425f]" />
                </button>
                <button
                  onClick={() => setShowPollCreator(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-[#f7b928]" />
                </button>
                <button
                  onClick={() => setShowPaidSettings(prev => !prev)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                  title="Monetización"
                >
                  <BadgeDollarSign className={cn("w-6 h-6 text-[#45bd62]", (isPaid || isSubscribersOnly) && "bg-[#e7f3ff] dark:bg-[#263951] rounded-full")} />
                </button>
              </div>
            </div>
          </div>

          {/* Preview de encuesta */}
          {pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2 && (
            <div className="border border-[#ced0d4] dark:border-[#3e4042] rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[#65676b] dark:text-[#b0b3b8] text-sm mb-2">
                    <BarChart3 size={16} />
                    <span>Encuesta · {pollDuration} {pollDuration === 1 ? 'día' : 'días'}</span>
                  </div>
                  <h3 className="font-semibold text-[#050505] dark:text-[#e4e6eb] mb-3">
                    {pollQuestion}
                  </h3>
                  <div className="space-y-2">
                    {pollOptions.filter(o => o.trim()).map((option, index) => (
                      <div
                        key={index}
                        className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg px-4 py-2.5 text-[#050505] dark:text-[#e4e6eb]"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPollQuestion("");
                    setPollOptions(["", ""]);
                  }}
                  className="text-[#65676b] hover:text-[#050505] dark:hover:text-[#e4e6eb] ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Opciones de monetización */}
          {showPaidSettings && (
            <div className="border border-[#ced0d4] dark:border-[#3e4042] rounded-lg p-4 space-y-4 bg-[#f7f8f9] dark:bg-[#2c2d2e]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="text-[#1877f2]" size={20} />
                  <div>
                    <h4 className="font-semibold text-sm text-[#050505] dark:text-[#e4e6eb]">Solo para suscriptores</h4>
                    <p className="text-xs text-[#65676b] dark:text-[#b0b3b8]">Restringir a personas con suscripción activa</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isSubscribersOnly} onChange={e => { setIsSubscribersOnly(e.target.checked); if (e.target.checked) setIsPaid(false); }} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1877f2]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="text-[#45bd62]" size={20} />
                  <div>
                    <h4 className="font-semibold text-sm text-[#050505] dark:text-[#e4e6eb]">Publicación de pago</h4>
                    <p className="text-xs text-[#65676b] dark:text-[#b0b3b8]">Cobrar acceso único a esta publicación</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isPaid} onChange={e => { setIsPaid(e.target.checked); if (e.target.checked) setIsSubscribersOnly(false); }} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1877f2]"></div>
                </label>
              </div>

              {isPaid && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#ced0d4] dark:border-[#3e4042]">
                  <span className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">Precio (€):</span>
                  <input
                    type="number"
                    min="0.50"
                    step="0.50"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] border border-[#ced0d4] dark:border-[#4e4f50] rounded px-3 py-1.5 outline-none focus:border-[#1877f2]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Botón publicar */}
          <Button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && mediaFiles.length === 0 && !(pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2))}
            className="w-full bg-[#1877f2] hover:bg-[#166fe5] disabled:bg-[#e4e6eb] dark:disabled:bg-[#3a3b3c] disabled:text-[#bcc0c4] text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </span>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </Modal>

      {/* Modal de etiquetar personas */}
      <Modal
        open={showTagFriends}
        onClose={() => setShowTagFriends(false)}
        title="Etiquetar personas"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={friendSearchQuery}
              onChange={(e) => {
                setFriendSearchQuery(e.target.value);
                searchFriends(e.target.value);
              }}
              placeholder="Buscar amigos..."
              className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877f2]"
            />
            {searchingFriends && (
              <div className="absolute right-3 top-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#65676b]" />
              </div>
            )}
          </div>

          {taggedFriends.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {taggedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-2 bg-[#e7f3ff] dark:bg-[#263951] rounded-full px-3 py-1.5"
                >
                  <span className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {friend.name}
                  </span>
                  <button
                    onClick={() => setTaggedFriends(prev => prev.filter(f => f.id !== friend.id))}
                    className="text-[#65676b] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1">
            {friendSearchResults.map((friend) => (
              <button
                key={friend.id}
                onClick={() => {
                  if (!taggedFriends.find(f => f.id === friend.id)) {
                    setTaggedFriends(prev => [...prev, {
                      id: friend.id,
                      name: friend.full_name,
                      picture: friend.profile_picture_url
                    }]);
                  }
                  setFriendSearchQuery("");
                  setFriendSearchResults([]);
                }}
                disabled={!!taggedFriends.find(f => f.id === friend.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Avatar
                  src={friend.profile_picture_url}
                  alt={friend.full_name}
                  size="md"
                  fallbackName={friend.full_name}
                />
                <span className="text-[#050505] dark:text-[#e4e6eb] font-semibold">
                  {friend.full_name}
                </span>
                {taggedFriends.find(f => f.id === friend.id) && (
                  <span className="text-xs text-[#45bd62] ml-auto">Etiquetado</span>
                )}
              </button>
            ))}
            {friendSearchQuery && !searchingFriends && friendSearchResults.length === 0 && (
              <p className="text-[#65676b] dark:text-[#b0b3b8] text-center py-4">
                No se encontraron amigos
              </p>
            )}
          </div>

          <Button
            onClick={() => setShowTagFriends(false)}
            className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold py-2 rounded-lg"
          >
            Listo
          </Button>
        </div>
      </Modal>

      {/* Modal de selección de sentimientos */}
      <Modal
        open={showFeelingPicker}
        onClose={() => setShowFeelingPicker(false)}
        title="¿Cómo te sientes?"
        size="md"
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {FEELINGS.map((feel) => (
              <button
                key={feel.label}
                onClick={() => {
                  setFeeling(feel);
                  setShowFeelingPicker(false);
                  toast.success(`Sentimiento "${feel.label}" agregado`);
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-left",
                  feeling?.label === feel.label && "bg-[#e7f3ff] dark:bg-[#263951]"
                )}
              >
                <span className="text-3xl">{feel.emoji}</span>
                <span className="text-[#050505] dark:text-[#e4e6eb] font-semibold">
                  {feel.label}
                </span>
              </button>
            ))}
          </div>
          {feeling && (
            <div className="pt-3 border-t border-[#ced0d4] dark:border-[#3e4042]">
              <Button
                onClick={() => {
                  setFeeling(null);
                  toast.success("Sentimiento eliminado");
                }}
                className="w-full bg-[#e4e6eb] dark:bg-[#3a3b3c] hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] text-[#050505] dark:text-[#e4e6eb] font-semibold py-2 rounded-lg"
              >
                Eliminar sentimiento
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de creación de encuestas */}
      <Modal
        open={showPollCreator}
        onClose={() => setShowPollCreator(false)}
        title="Crear encuesta"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
              Pregunta
            </label>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Haz una pregunta..."
              className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877f2]"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
              Opciones
            </label>
            <div className="space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="flex-1 bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1877f2]"
                    maxLength={100}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-[#65676b] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 10 && (
              <button
                onClick={addPollOption}
                className="mt-2 flex items-center gap-2 text-[#1877f2] hover:bg-[#e7f3ff] dark:hover:bg-[#263951] px-3 py-2 rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span className="font-semibold text-sm">Agregar opción</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
              Duración de la encuesta
            </label>
            <select
              value={pollDuration}
              onChange={(e) => setPollDuration(Number(e.target.value))}
              className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#1877f2]"
            >
              <option value={1}>1 día</option>
              <option value={3}>3 días</option>
              <option value={7}>1 semana</option>
              <option value={14}>2 semanas</option>
              <option value={30}>1 mes</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowPollCreator(false)}
              className="flex-1 bg-[#e4e6eb] dark:bg-[#3a3b3c] hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] text-[#050505] dark:text-[#e4e6eb] font-semibold py-2 rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
                  setShowPollCreator(false);
                  toast.success("Encuesta agregada");
                } else {
                  toast.error("Completa la pregunta y al menos 2 opciones");
                }
              }}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="flex-1 bg-[#1877f2] hover:bg-[#166fe5] disabled:bg-[#e4e6eb] dark:disabled:bg-[#3a3b3c] disabled:text-[#bcc0c4] text-white font-semibold py-2 rounded-lg"
            >
              Listo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de ubicación */}
      <Modal
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        title="Registrar visita"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[#65676b] dark:text-[#b0b3b8] text-sm">
            Comparte tu ubicación actual en la publicación
          </p>

          {location ? (
            <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f3425f]/20 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#f3425f]" />
              </div>
              <div className="flex-1">
                <p className="text-[#050505] dark:text-[#e4e6eb] font-semibold">
                  {location.name}
                </p>
                <p className="text-[#65676b] dark:text-[#b0b3b8] text-sm">Ubicación actual</p>
              </div>
              <button
                onClick={() => setLocation(null)}
                className="text-[#65676b] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <Button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50] text-[#050505] dark:text-[#e4e6eb] font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Obtener ubicación actual
                </>
              )}
            </Button>
          )}

          <Button
            onClick={() => setShowLocationPicker(false)}
            className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold py-2 rounded-lg"
          >
            Listo
          </Button>
        </div>
      </Modal>

      {/* Editor de imagen */}
      {showImageEditor && pendingFile && (
        <Modal
          open={true}
          onClose={() => {
            setShowImageEditor(false);
            setPendingFile(null);
          }}
          title="Editar imagen"
          size="xl"
        >
          <ImageUploaderEditor
            initialFile={pendingFile}
            onUpload={handleImageProcessed}
            onCancel={() => {
              setShowImageEditor(false);
              setPendingFile(null);
            }}
          />
        </Modal>
      )}

      {/* Editor de video */}
      {showVideoEditor && pendingFile && (
        <Modal
          open={true}
          onClose={() => {
            setShowVideoEditor(false);
            setPendingFile(null);
          }}
          title="Editar video"
          size="xl"
        >
          <VideoUploaderEditor
            initialFile={pendingFile}
            onUpload={handleVideoProcessed}
            onCancel={() => {
              setShowVideoEditor(false);
              setPendingFile(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}

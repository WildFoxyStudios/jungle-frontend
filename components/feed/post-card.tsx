"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  EyeOff,
  Trash2,
  Edit2,
  Pin,
  BookmarkCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi } from "@/lib/api-posts";
import { uploadApi } from "@/lib/api-upload";
import { reactionsApi } from "@/lib/api-posts";
import { sharesApi } from "@/lib/api-posts";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ReactionPicker } from "./reaction-picker";
import { CommentSection } from "./comment-section";
import { LinkPreview } from "./link-preview";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getProxyUrl } from "@/lib/media-proxy";
import type { Post } from "@/lib/types";
import { ImageUploaderEditor } from "@/components/media/ImageUploaderEditor";
import { RichContent } from "@/components/ui/rich-content";
import { VideoUploaderEditor } from "@/components/media/VideoUploaderEditor";
import type { ImageSizes } from "@/lib/image-compression";
import { MapPin, Smile, Users, BarChart3, Globe, Lock, ChevronDown, Coins } from "lucide-react";
import { pollsApi } from "@/lib/api-polls";
import { monetizationApi } from "@/lib/api-monetization";

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onUpdate?: (post: Post) => void;
  showGroupLink?: boolean;
  initialReaction?: string;
  initialSaved?: boolean;
}

const visibilityConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  public: { icon: <Globe size={12} />, label: "Público" },
  friends: { icon: <Users size={12} />, label: "Amigos" },
  only_me: { icon: <Lock size={12} />, label: "Solo yo" },
};

export function PostCard({ post, onDelete, onUpdate, showGroupLink, initialReaction, initialSaved }: PostCardProps) {
  const { user } = useAuth();
  const toast = useToast();
  const isOwner = user?.id === post.user_id;

  const [currentReaction, setCurrentReaction] = useState<string | null>(initialReaction ?? null);
  const [localReactionsCount, setLocalReactionsCount] = useState(post.reactions_count ?? 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count ?? 0);
  const [localSharesCount] = useState(post.shares_count ?? 0);
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [editVisibility, setEditVisibility] = useState<"public" | "friends" | "only_me" | "custom">(post.visibility ?? "public");
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>(post.media_urls ?? []);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [shareComment, setShareComment] = useState("");
  const [sharing, setSharing] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Tip State
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(3);
  const [tipping, setTipping] = useState(false);

  if (deleted) return null;

  const handleReact = async (type: string) => {
    const prev = currentReaction;
    setCurrentReaction(type);
    if (!prev) setLocalReactionsCount(n => n + 1);
    try {
      await reactionsApi.reactToPost(post.id, type);
    } catch {
      setCurrentReaction(prev);
      if (!prev) setLocalReactionsCount(n => n - 1);
    }
  };

  const handleRemoveReaction = async () => {
    const prev = currentReaction;
    setCurrentReaction(null);
    setLocalReactionsCount(n => Math.max(0, n - 1));
    try {
      await reactionsApi.removeReaction(post.id);
    } catch {
      setCurrentReaction(prev);
      setLocalReactionsCount(n => n + 1);
    }
  };

  const handleSave = async () => {
    setSaved(v => !v);
    try {
      if (saved) {
        await postsApi.unsavePost(post.id);
      } else {
        await postsApi.savePost(post.id);
        toast.success("Guardado en tu colección");
      }
    } catch {
      setSaved(v => !v);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await sharesApi.sharePost(post.id, shareComment, "public");
      toast.success("Publicación compartida");
      setShowShareModal(false);
      setShareComment("");
    } catch {
      toast.error("Error al compartir");
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await postsApi.deletePost(post.id);
      setDeleted(true);
      onDelete?.(post.id);
      toast.success("Publicación eliminada");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const handlePurchasePost = async () => {
    setPurchasing(true);
    try {
      await monetizationApi.purchasePost(post.id);
      toast.success("¡Publicación desbloqueada!");
      onUpdate?.({ ...post, is_purchased: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al comprar o saldo insuficiente");
    } finally {
      setPurchasing(false);
    }
  };

  const handleSendTip = async () => {
    if (tipAmount < 0.5) {
      toast.error("La propina mínima es €0.50");
      return;
    }
    setTipping(true);
    try {
      await monetizationApi.sendTip(post.user_id, tipAmount, post.id);
      toast.success(`Has enviado una propina de €${tipAmount.toFixed(2)}`);
      setShowTipModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al enviar la propina");
    } finally {
      setTipping(false);
    }
  };

  const handleHide = async () => {
    try {
      await postsApi.hidePost(post.id);
      setDeleted(true);
      toast.info("Publicación ocultada");
    } catch {
      toast.error("Error al ocultar");
    }
  };

  const handleVotePoll = async (optionId: string) => {
    if (!post.poll || post.poll.user_votes.length > 0) return;
    
    try {
      const updatedPoll = await pollsApi.vote(post.poll.id, { option_ids: [optionId] });
      const updatedPost = { ...post, poll: updatedPoll };
      onUpdate?.(updatedPost);
      toast.success("Voto registrado");
    } catch {
      toast.error("Error al votar");
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const updated = await postsApi.updatePost(post.id, {
        content: editContent,
        visibility: editVisibility,
        media_urls: editMediaUrls,
      });
      onUpdate?.(updated);
      setShowEditModal(false);
      toast.success("Publicación actualizada");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setEditMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setPendingFile(file);
    if (file.type.startsWith("image")) {
      setShowImageEditor(true);
    } else if (file.type.startsWith("video")) {
      setShowVideoEditor(true);
    }
  };

  const handleImageProcessed = async (sizes: ImageSizes) => {
    setUploadingMedia(true);
    try {
      const responses = await uploadApi.uploadPostMedia([sizes.original]);
      const newUrls = responses.map(r => r.url);
      setEditMediaUrls(prev => [...prev, ...newUrls]);
      toast.success("Imagen agregada");
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploadingMedia(false);
      setShowImageEditor(false);
      setPendingFile(null);
    }
  };

  const handleVideoProcessed = async (result: {
    videoFile: File;
    thumbnailFile: File;
    originalSize: number;
    processedSize: number;
    duration: number;
  }) => {
    setUploadingMedia(true);
    try {
      const responses = await uploadApi.uploadPostMedia([result.videoFile]);
      const newUrls = responses.map(r => r.url);
      setEditMediaUrls(prev => [...prev, ...newUrls]);
      toast.success("Video agregado");
    } catch {
      toast.error("Error al subir video");
    } finally {
      setUploadingMedia(false);
      setShowVideoEditor(false);
      setPendingFile(null);
    }
  };

  const media = post.media_urls ?? [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = post.content?.match(urlRegex) || [];
  const firstUrl = urls.length > 0 ? urls[0] : null;

  const visInfo = visibilityConfig[post.visibility] ?? visibilityConfig.public;

  // Content truncation
  const CONTENT_LIMIT = 300;
  const shouldTruncate = (post.content?.length ?? 0) > CONTENT_LIMIT;
  const displayContent = shouldTruncate && !expanded
    ? post.content!.slice(0, CONTENT_LIMIT)
    : post.content;

  const isLockedPaid = !isOwner && post.is_paid && !post.is_purchased;
  const isLockedSub = !isOwner && post.is_subscribers_only && !post.is_subscribed;
  const isLocked = isLockedPaid || isLockedSub;

  return (
    <article className="bg-white dark:bg-[#242526] rounded-lg shadow-sm mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4 pb-0">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.user_id}`}>
            <Avatar
              src={post.user_profile_picture}
              alt={post.user_name}
              size="md"
              fallbackName={post.user_name}
            />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${post.user_id}`}
                className="font-semibold text-[#050505] dark:text-[#e4e6eb] text-[15px] hover:underline"
              >
                {post.user_name || "Usuario"}
              </Link>
              {post.feeling && (
                <span className="text-[#65676b] dark:text-[#b0b3b8] text-[13px]">
                  está {post.feeling}
                </span>
              )}
              {post.tagged_users && post.tagged_users.length > 0 && (
                <span className="text-[#65676b] dark:text-[#b0b3b8] text-[13px]">
                  con{" "}
                  <span className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {post.tagged_users.length === 1
                      ? post.tagged_users[0]
                      : `${post.tagged_users.length} personas`}
                  </span>
                </span>
              )}
              {post.location && (
                <span className="text-[#65676b] dark:text-[#b0b3b8] text-[13px]">
                  en{" "}
                  <span className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {post.location}
                  </span>
                </span>
              )}
              {post.is_pinned && (
                <Badge variant="primary" size="sm" dot>
                  Fijada
                </Badge>
              )}
              {post.is_subscribers_only && (
                <Badge variant="default" size="sm" className="bg-[#e7f3ff] text-[#1877f2] dark:bg-[#1877f2]/20 border-none">
                  Suscriptores
                </Badge>
              )}
              {post.is_paid && (
                <Badge variant="default" size="sm" className="bg-[#e7f3ff] text-[#1877f2] dark:bg-[#1877f2]/20 border-none">
                  €{post.price?.toFixed(2)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
              <time dateTime={post.created_at}>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </time>
              <span>·</span>
              <span className="flex items-center gap-0.5" title={visInfo.label}>
                {visInfo.icon}
              </span>
            </div>
          </div>
        </div>

        <Dropdown
          trigger={
            <button className="p-2 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-[#65676b] dark:text-[#b0b3b8]">
              <MoreHorizontal size={20} />
            </button>
          }
          items={[
            ...(isOwner
              ? [
                  {
                    label: "Editar publicación",
                    icon: <Edit2 size={15} />,
                    onClick: () => setShowEditModal(true),
                  },
                  {
                    label: post.is_pinned ? "Desfijar publicación" : "Fijar en perfil",
                    icon: <Pin size={15} />,
                    onClick: () => postsApi.pinPost(post.id),
                  },
                  { separator: true as const },
                  {
                    label: "Eliminar publicación",
                    icon: <Trash2 size={15} />,
                    onClick: handleDelete,
                    danger: true,
                  },
                ]
              : [
                  {
                    label: saved ? "Quitar de guardados" : "Guardar publicación",
                    icon: <Bookmark size={15} />,
                    onClick: handleSave,
                  },
                  {
                    label: "Ocultar publicación",
                    icon: <EyeOff size={15} />,
                    onClick: handleHide,
                  },
                  { separator: true as const },
                  {
                    label: "Reportar publicación",
                    icon: <Flag size={15} />,
                    onClick: () => postsApi.reportPost(post.id, "spam"),
                    danger: true,
                  },
                ]),
          ]}
        />
      </div>

      {/* Content && Media Wrapper */}
      {isLocked ? (
        <div className="px-3 sm:px-4 pt-2 pb-5 relative">
          <div className="select-none pointer-events-none filter blur-[8px] opacity-60">
            <p className="text-[#050505] dark:text-[#e4e6eb] text-[15px] leading-[1.3333] mb-3">
              Este contenido es exclusivo y está protegido por un paywall. Desbloquea para ver el mensaje completo y los archivos multimedia ocultos de esta publicación.
            </p>
            <div className="w-full h-[200px] bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[4px] rounded-lg border border-[#ced0d4] dark:border-[#3e4042] m-3 p-4 shadow-sm z-10 transition-all">
            <div className="w-12 h-12 bg-white dark:bg-[#242526] rounded-full flex items-center justify-center shadow-md mb-3">
              <Lock className="w-6 h-6 text-[#1877f2]" />
            </div>
            <h4 className="font-bold text-[18px] text-[#050505] dark:text-[#e4e6eb] mb-1">
              {isLockedPaid ? "Publicación exclusiva" : "Solo para suscriptores"}
            </h4>
            <p className="text-[#65676b] dark:text-[#b0b3b8] text-[15px] text-center max-w-[280px] mb-5">
              {isLockedPaid
                ? `Desbloquea esta publicación por €${post.price?.toFixed(2)}`
                : "Suscríbete a este creador para ver su contenido exclusivo y apoyar su trabajo."}
            </p>
            {isLockedPaid ? (
              <Button onClick={handlePurchasePost} loading={purchasing} size="lg" className="w-full max-w-[280px] bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg shadow">
                Desbloquear pago (€{post.price?.toFixed(2)})
              </Button>
            ) : (
              <Link href={`/profile/${post.user_id}`} className="w-full max-w-[280px]">
                <Button size="lg" className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg shadow">
                  Suscribirse para ver
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {post.content && (
        <div className="px-3 sm:px-4 pt-2 pb-3">
          <p className="text-[#050505] dark:text-[#e4e6eb] text-[15px] leading-[1.3333] whitespace-pre-wrap break-words">
            <RichContent content={displayContent || ""} />
            {shouldTruncate && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[#65676b] dark:text-[#b0b3b8] hover:underline ml-1 font-semibold text-[15px]"
              >
                ... Ver más
              </button>
            )}
          </p>

          {firstUrl && media.length === 0 && (
            <div className="mt-3">
              <LinkPreview url={firstUrl} />
            </div>
          )}
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <div className="px-3 sm:px-4 pb-3">
          <div className="border border-[#ced0d4] dark:border-[#3e4042] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
              <BarChart3 size={16} />
              <span>
                {post.poll.total_votes} {post.poll.total_votes === 1 ? 'voto' : 'votos'}
                {post.poll.closes_at && (
                  <> · Finaliza {formatDistanceToNow(new Date(post.poll.closes_at), { addSuffix: true, locale: es })}</>
                )}
              </span>
            </div>
            <h3 className="font-semibold text-[#050505] dark:text-[#e4e6eb] text-[15px]">
              {post.poll.question}
            </h3>
            <div className="space-y-2">
              {post.poll.options.map((option) => {
                const percentage = option.percentage;
                const isUserVote = post.poll!.user_votes.includes(option.id);
                const hasVoted = post.poll!.user_votes.length > 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVotePoll(option.id)}
                    disabled={hasVoted}
                    className={cn(
                      "w-full relative overflow-hidden rounded-lg border transition-all",
                      isUserVote
                        ? "border-[#1877f2] bg-[#e7f3ff] dark:bg-[#263951]"
                        : "border-[#ced0d4] dark:border-[#3e4042] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]",
                      hasVoted && "cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 transition-all duration-500",
                        isUserVote
                          ? "bg-[#1877f2]/15 dark:bg-[#1877f2]/20"
                          : "bg-[#e4e6eb] dark:bg-[#3a3b3c]"
                      )}
                      style={{ width: hasVoted ? `${percentage}%` : '0%' }}
                    />
                    <div className="relative flex items-center justify-between px-4 py-2.5">
                      <span className={cn(
                        "font-medium text-[14px]",
                        isUserVote
                          ? "text-[#1877f2]"
                          : "text-[#050505] dark:text-[#e4e6eb]"
                      )}>
                        {option.option_text}
                      </span>
                      {hasVoted && (
                        <span className={cn(
                          "text-[13px] font-semibold",
                          isUserVote
                            ? "text-[#1877f2]"
                            : "text-[#65676b] dark:text-[#b0b3b8]"
                        )}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className={cn(
          "overflow-hidden",
          media.length === 1 && "",
          media.length === 2 && "grid grid-cols-2 gap-[2px]",
          media.length === 3 && "grid grid-cols-2 gap-[2px]",
          media.length >= 4 && "grid grid-cols-2 gap-[2px]",
        )}>
          {media.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-black overflow-hidden",
                media.length === 1 ? "w-full max-h-[600px]" : "aspect-square",
                media.length === 3 && i === 0 && "row-span-2",
              )}
            >
              {url.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={getProxyUrl(url)}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={getProxyUrl(url)}
                  alt={`Media ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {i === 3 && media.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{media.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reaction/Comment/Share Summary Bar */}
      {(localReactionsCount > 0 || localCommentsCount > 0 || localSharesCount > 0) && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
          <div className="flex items-center gap-1.5">
            {localReactionsCount > 0 && (
              <button className="flex items-center gap-1 hover:underline">
                <span className="flex -space-x-1 text-base">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#1877f2] text-[10px]">👍</span>
                  {localReactionsCount > 1 && <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#f33e58] text-[10px]">❤️</span>}
                </span>
                <span>{localReactionsCount}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {localCommentsCount > 0 && (
              <button
                onClick={() => setShowComments(v => !v)}
                className="hover:underline"
              >
                {localCommentsCount}{" "}
                {localCommentsCount === 1 ? "comentario" : "comentarios"}
              </button>
            )}
            {localSharesCount > 0 && (
              <span>
                {localSharesCount}{" "}
                {localSharesCount === 1 ? "compartido" : "compartidos"}
              </span>
            )}
          </div>
            </div>
          )}
        </>
      )}

      {/* Reactions & Interaction bar */}
      <div className="px-3 sm:px-4 py-2 border-t border-[#ced0d4] dark:border-[#3e4042]">
        <div className="flex items-center">
          <ReactionPicker
            postId={post.id}
            currentReaction={currentReaction}
            reactionsCount={localReactionsCount}
            onReact={handleReact}
            onRemove={handleRemoveReaction}
          />
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">Comentar</span>
          </button>
          {!isOwner && (
            <button
              onClick={() => setShowTipModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8] hover:text-[#f3b728] hover:bg-[#fff9e6] dark:hover:bg-[#3d3215] transition-colors"
            >
              <Coins size={18} />
              <span className="hidden sm:inline">Dar propina</span>
            </button>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Compartir</span>
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[14px] font-semibold transition-colors",
              saved
                ? "text-[#1877f2] hover:bg-[#e7f3ff] dark:hover:bg-[#263951]"
                : "text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]",
            )}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            <span className="hidden sm:inline">{saved ? "Guardado" : "Guardar"}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[#ced0d4] dark:border-[#3e4042] px-3 sm:px-4 py-3">
          <CommentSection postId={post.id} onCountChange={setLocalCommentsCount} />
        </div>
      )}

      {/* Share Modal */}
      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartir publicación"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleShare} loading={sharing} className="bg-[#1877f2] hover:bg-[#166fe5] text-white">
              Compartir ahora
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <textarea
            value={shareComment}
            onChange={e => setShareComment(e.target.value)}
            placeholder="Di algo sobre esto..."
            className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#1877f2]"
            rows={3}
          />
          <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-xl p-3 text-[13px] text-[#65676b] dark:text-[#b0b3b8]">
            <p className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
              {post.user_name}
            </p>
            <p className="line-clamp-2 mt-0.5">{post.content}</p>
          </div>
        </div>
      </Modal>

      {/* Tip Modal */}
      <Modal
        open={showTipModal}
        onClose={() => setShowTipModal(false)}
        title="Apoyar con propina"
        size="sm"
        footer={
          <Button onClick={handleSendTip} loading={tipping} className="w-full bg-[#f3b728] hover:bg-[#dca11e] text-black font-semibold text-lg py-2 rounded-xl border-none">
            Enviar €{tipAmount.toFixed(2)}
          </Button>
        }
      >
        <div className="space-y-5 text-center px-4 py-2">
          <p className="text-[#65676b] dark:text-[#b0b3b8] text-[15px]">
            Apoya a <span className="font-bold text-[#050505] dark:text-[#e4e6eb]">{post.user_name}</span> enviando una propina directa desde tu saldo.
          </p>
          
          <div className="grid grid-cols-4 gap-2">
            {[1, 3, 5, 10].map(amount => (
              <button
                key={amount}
                onClick={() => setTipAmount(amount)}
                className={cn(
                  "py-2.5 rounded-lg border-2 font-bold text-[15px] transition-all",
                  tipAmount === amount 
                    ? "border-[#f3b728] bg-[#fff9e6] dark:bg-[#3d3215] text-[#dca11e]" 
                    : "border-transparent bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#65676b] dark:text-[#b0b3b8] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50]"
                )}
              >
                €{amount}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="text-[13px] font-semibold text-[#65676b] dark:text-[#b0b3b8] block mb-2 text-left">
              O introduce un monto personalizado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#65676b] dark:text-[#b0b3b8]">€</span>
              <input 
                type="number" 
                min="0.5" 
                step="0.5" 
                value={tipAmount} 
                onChange={e => setTipAmount(parseFloat(e.target.value) || 0)} 
                className="w-full pl-9 pr-4 py-3 bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] text-lg font-bold rounded-xl outline-none focus:ring-2 focus:ring-[#f3b728]"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar publicación"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} loading={updating} className="bg-[#1877f2] hover:bg-[#166fe5] text-white">
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="¿Qué estás pensando?"
            className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-lg px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#1877f2] min-h-[120px]"
            rows={4}
          />

          {/* Current media files */}
          {editMediaUrls.length > 0 && (
            <div>
              <label className="block text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
                Archivos multimedia ({editMediaUrls.length})
              </label>
              <div className="grid grid-cols-3 gap-2">
                {editMediaUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg overflow-hidden">
                    {url.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={getProxyUrl(url)} className="w-full h-full object-cover" />
                    ) : (
                      <img src={getProxyUrl(url)} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-1 right-1 w-7 h-7 bg-white dark:bg-[#242526] rounded-full flex items-center justify-center hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors shadow-md"
                      title="Eliminar archivo"
                    >
                      <Trash2 size={14} className="text-[#f3425f]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new media */}
          <div>
            <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-[#ced0d4] dark:border-[#3e4042] rounded-lg cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors">
              <div className="flex flex-col items-center text-[#65676b] dark:text-[#b0b3b8]">
                {uploadingMedia ? (
                  <span className="text-[13px]">Subiendo...</span>
                ) : (
                  <>
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-[13px]">Agregar fotos/videos</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleAddMedia}
                disabled={uploadingMedia}
              />
            </label>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#050505] dark:text-[#e4e6eb] mb-2">
              Visibilidad
            </label>
            <select
              value={editVisibility}
              onChange={e => setEditVisibility(e.target.value as "public" | "friends" | "only_me" | "custom")}
              className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] text-[#050505] dark:text-[#e4e6eb] rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1877f2]"
            >
              <option value="public">🌍 Público</option>
              <option value="friends">👥 Amigos</option>
              <option value="only_me">🔒 Solo yo</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Image Editor Modal */}
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

      {/* Video Editor Modal */}
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
    </article>
  );
}

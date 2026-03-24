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

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onUpdate?: (post: Post) => void;
  showGroupLink?: boolean;
}

const visibilityIcon: Record<string, string> = {
  public: "🌍",
  friends: "👥",
  only_me: "🔒",
};

export function PostCard({ post, onDelete, onUpdate, showGroupLink }: PostCardProps) {
  const { user } = useAuth();
  const toast = useToast();
  const isOwner = user?.id === post.user_id;

  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [localReactionsCount, setLocalReactionsCount] = useState(post.reactions_count ?? 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count ?? 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareComment, setShareComment] = useState("");
  const [sharing, setSharing] = useState(false);
  const [deleted, setDeleted] = useState(false);

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

  const handleHide = async () => {
    try {
      await postsApi.hidePost(post.id);
      setDeleted(true);
      toast.info("Publicación ocultada");
    } catch {
      toast.error("Error al ocultar");
    }
  };

  const media = post.media_urls ?? [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = post.content?.match(urlRegex) || [];
  const firstUrl = urls.length > 0 ? urls[0] : null;

  return (
    <article className="surface animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
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
                className="font-semibold text-slate-900 dark:text-slate-50 text-sm hover:underline"
              >
                {post.user_name}
              </Link>
              {post.is_pinned && (
                <Badge variant="primary" size="sm" dot>
                  Fijada
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <time dateTime={post.created_at}>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </time>
              <span>·</span>
              <span>{visibilityIcon[post.visibility] ?? "🌍"}</span>
              {post.feeling && (
                <>
                  <span>·</span>
                  <span>{post.feeling}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Dropdown
          trigger={
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-400 hover:text-slate-600">
              <MoreHorizontal size={20} />
            </button>
          }
          items={[
            ...(isOwner
              ? [
                  {
                    label: "Editar",
                    icon: <Edit2 size={15} />,
                    onClick: () => {},
                  },
                  {
                    label: post.is_pinned ? "Desfijar" : "Fijar en perfil",
                    icon: <Pin size={15} />,
                    onClick: () => postsApi.pinPost(post.id),
                  },
                  { separator: true as const },
                  {
                    label: "Eliminar",
                    icon: <Trash2 size={15} />,
                    onClick: handleDelete,
                    danger: true,
                  },
                ]
              : [
                  {
                    label: "Guardar publicación",
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
                    label: "Reportar",
                    icon: <Flag size={15} />,
                    onClick: () => postsApi.reportPost(post.id, "spam"),
                    danger: true,
                  },
                ]),
          ]}
        />
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-slate-800 dark:text-slate-100 text-[0.9375rem] leading-relaxed post-content whitespace-pre-wrap">
            {post.content.length > 400 ? (
              <>
                {post.content.slice(0, 400)}
                <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium ml-1">
                  ...ver más
                </button>
              </>
            ) : (
              post.content
            )}
          </p>

          {firstUrl && media.length === 0 && (
            <LinkPreview url={firstUrl} />
          )}
        </div>
      )}

      {/* Media */}
      {media.length > 0 && (
        <div
          className={cn(
            "overflow-hidden",
            media.length === 1
              ? "img-grid-1"
              : media.length === 2
              ? "img-grid-2"
              : media.length >= 3
              ? "img-grid-3"
              : "",
          )}
        >
          {media.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-slate-900",
                media.length === 1 ? "w-full" : "aspect-square",
                i === 0 && media.length === 3 ? "first" : "",
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

      {/* Reaction summary */}
      {(localReactionsCount > 0 || localCommentsCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
          {localReactionsCount > 0 && (
            <span className="flex items-center gap-1">
              <span>👍❤️😂</span>
              <span>{localReactionsCount}</span>
            </span>
          )}
          {localCommentsCount > 0 && (
            <button
              onClick={() => setShowComments(v => !v)}
              className="hover:underline ml-auto"
            >
              {localCommentsCount}{" "}
              {localCommentsCount === 1 ? "comentario" : "comentarios"}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-3 py-1 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-around">
          <ReactionPicker
            postId={post.id}
            currentReaction={currentReaction}
            reactionsCount={localReactionsCount}
            onReact={handleReact}
            onRemove={handleRemoveReaction}
          />
          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MessageCircle size={18} />
            <span>Comentar</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Share2 size={18} />
            <span>Compartir</span>
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              saved
                ? "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800",
            )}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
          <CommentSection postId={post.id} onCountChange={setLocalCommentsCount} />
        </div>
      )}

      {/* Share modal */}
      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Compartir publicación"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleShare} loading={sharing}>
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
            className="input-base resize-none"
            rows={3}
          />
          <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-slate-500">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              {post.user_name}
            </p>
            <p className="line-clamp-2 mt-0.5">{post.content}</p>
          </div>
        </div>
      </Modal>
    </article>
  );
}

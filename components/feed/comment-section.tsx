"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, CornerDownRight, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { commentsApi } from "@/lib/api-posts";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { MentionInput } from "@/components/ui/mention-input";
import { RichContent } from "@/components/ui/rich-content";
import type { Comment } from "@/lib/types";

// ─── Comment API adapter ──────────────────────────────────────────────────────
// Allows CommentSection to work with different backends (posts, videos, reels)

export interface CommentApiAdapter {
  getComments: (entityId: string, limit?: number, offset?: number) => Promise<any[]>;
  createComment: (entityId: string, data: { content: string; parent_comment_id?: string }) => Promise<any>;
  deleteComment: (commentId: string) => Promise<void>;
  reactToComment?: (commentId: string, type: string) => Promise<void>;
  removeCommentReaction?: (commentId: string) => Promise<void>;
  getReplies?: (commentId: string, limit?: number, offset?: number) => Promise<any[]>;
}

/** Default adapter using the posts comments API */
export const postCommentsAdapter: CommentApiAdapter = {
  getComments: (postId, limit, offset) => commentsApi.getComments(postId, limit, offset),
  createComment: (postId, data) => commentsApi.createComment(postId, data),
  deleteComment: (commentId) => commentsApi.deleteComment(commentId),
  reactToComment: (commentId, type) => commentsApi.reactToComment(commentId, type),
  removeCommentReaction: (commentId) => commentsApi.removeCommentReaction(commentId),
  getReplies: (commentId, limit, offset) => commentsApi.getReplies(commentId, limit, offset),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCommentUser(c: Comment) {
  if (c.author) {
    return { name: c.author.full_name || c.author.username, picture: c.author.profile_picture_url, userId: c.author.id };
  }
  return { name: c.user_name || "Usuario", picture: c.user_picture, userId: c.user_id };
}

function flattenComment(raw: any): Comment {
  if (raw.comment && raw.author) {
    return { ...raw.comment, author: raw.author, my_reaction: raw.my_reaction, replies: raw.replies?.map(flattenComment) };
  }
  return raw;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommentSectionProps {
  /** The entity ID (post ID, video ID, reel ID, etc.) */
  entityId?: string;
  /** Optional API adapter. Defaults to postCommentsAdapter */
  api?: CommentApiAdapter;
  /** Called when comment count changes */
  onCountChange?: (count: number) => void;
  /** Visual variant */
  variant?: "default" | "panel";
  /** Max height for panel variant */
  maxHeight?: string;
  /** @deprecated Use entityId instead */
  postId?: string;
}

export function CommentSection({ entityId, postId, api = postCommentsAdapter, onCountChange, variant = "default", maxHeight }: CommentSectionProps) {
  const id = entityId || postId || "";
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getComments(id)
      .then((raw: any[]) => {
        const flattened = raw.map(flattenComment);
        setComments(flattened);
        onCountChange?.(flattened.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async () => {
    if (!content.trim() || !id) return;
    setSubmitting(true);
    try {
      const raw: any = await api.createComment(id, {
        content: content.trim(),
        parent_comment_id: replyTo?.id,
      });
      const newComment = flattenComment(raw);
      newComment.user_name = user?.full_name || user?.username;
      newComment.user_picture = user?.profile_picture_url;
      newComment.user_id = user?.id ?? "";

      if (replyTo) {
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [...(c.replies ?? []), newComment], replies_count: (c.replies_count ?? 0) + 1 }
            : c
        ));
      } else {
        setComments(prev => [newComment, ...prev]);
      }
      onCountChange?.(comments.length + 1);
      setContent("");
      setReplyTo(null);
    } catch {} finally { setSubmitting(false); }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCountChange?.(Math.max(0, comments.length - 1));
    } catch {}
  };

  const isPanel = variant === "panel";

  return (
    <div className={cn("flex flex-col", isPanel && "h-full")}>
      {/* Comments list */}
      <div className={cn(
        "space-y-3",
        isPanel && "flex-1 overflow-y-auto px-4 py-3",
        maxHeight && `max-h-[${maxHeight}] overflow-y-auto`,
      )}>
        {loading && <div className="flex justify-center py-4"><Spinner size="sm" /></div>}
        {!loading && comments.length === 0 && (
          <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">
            Sé el primero en comentar 💬
          </p>
        )}
        {!loading && comments.map(c => (
          <CommentItem key={c.id} comment={c} currentUserId={user?.id ?? ""} entityId={id} api={api}
            onDelete={deleteComment} onReply={setReplyTo} />
        ))}
      </div>

      {/* Input */}
      <div className={cn("flex items-start gap-2", isPanel && "px-4 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0")}>
        <Avatar src={user?.profile_picture_url} alt={user?.full_name} size="sm" fallbackName={user?.full_name ?? user?.username} />
        <div className="flex-1 min-w-0">
          {replyTo && (
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
              <CornerDownRight size={12} />
              Respondiendo a {getCommentUser(replyTo).name}
              <button onClick={() => setReplyTo(null)} className="ml-1 text-slate-400 hover:text-slate-600"><X size={12} /></button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 rounded-full px-4 py-2">
            <MentionInput
              value={content}
              onChange={setContent}
              onSubmit={submit}
              placeholder={replyTo ? "Responder..." : "Escribe un comentario..."}
              inputClassName="flex-1"
            />
            <button onClick={submit} disabled={!content.trim() || submitting}
              className={cn("text-indigo-600 transition-colors shrink-0", !content.trim() || submitting ? "opacity-40" : "hover:text-indigo-800")}>
              {submitting ? <Spinner size="xs" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({ comment: c, currentUserId, entityId, api, onDelete, onReply }: {
  comment: Comment; currentUserId: string; entityId: string; api: CommentApiAdapter;
  onDelete: (id: string) => void; onReply: (c: Comment) => void;
}) {
  const { name, picture, userId } = getCommentUser(c);
  const isOwner = (c.user_id || userId) === currentUserId;
  const [liked, setLiked] = useState<string | null>(c.my_reaction ?? null);
  const [likesCount, setLikesCount] = useState(c.reactions_count ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(c.replies ?? []);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const handleLike = async () => {
    if (!api.reactToComment || !api.removeCommentReaction) return;
    const wasLiked = liked;
    if (wasLiked) {
      setLiked(null); setLikesCount(n => Math.max(0, n - 1));
      try { await api.removeCommentReaction(c.id); } catch { setLiked(wasLiked); setLikesCount(n => n + 1); }
    } else {
      setLiked("like"); setLikesCount(n => n + 1);
      try { await api.reactToComment(c.id, "like"); } catch { setLiked(null); setLikesCount(n => Math.max(0, n - 1)); }
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0 || loadingReplies) { setShowReplies(v => !v); return; }
    if (!api.getReplies) return;
    setLoadingReplies(true); setShowReplies(true);
    try { const raw: any[] = await api.getReplies(c.id); setReplies(raw.map(flattenComment)); }
    catch {} finally { setLoadingReplies(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-2">
        <Link href={`/profile/${userId}`}>
          <Avatar src={picture} alt={name} size="sm" fallbackName={name} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl px-3.5 py-2.5 inline-block max-w-full">
            <Link href={`/profile/${userId}`} className="text-xs font-bold text-slate-900 dark:text-slate-50 hover:underline">{name}</Link>
            <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-wrap break-words">
              <RichContent content={c.content} />
            </p>
          </div>
          {likesCount > 0 && (
            <div className="inline-flex items-center gap-1 ml-2 -mt-2 relative z-10 bg-white dark:bg-gray-900 rounded-full px-1.5 py-0.5 shadow-sm border border-slate-200 dark:border-slate-700 text-[10px]">
              <span>👍</span><span className="font-bold text-slate-600 dark:text-slate-300">{likesCount}</span>
            </div>
          )}
          <div className="flex items-center gap-3 mt-1 px-2">
            <span className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}</span>
            {api.reactToComment && (
              <button onClick={handleLike} className={cn("text-[11px] font-bold transition-colors", liked ? "text-blue-600" : "text-slate-500 hover:text-slate-700")}>Me gusta</button>
            )}
            <button onClick={() => onReply(c)} className="text-[11px] font-bold text-slate-500 hover:text-slate-700">Responder</button>
            {isOwner && <button onClick={() => onDelete(c.id)} className="text-[11px] font-bold text-red-500 hover:text-red-700">Eliminar</button>}
          </div>
          {(c.replies_count > 0 || replies.length > 0) && api.getReplies && (
            <button onClick={loadReplies} className="flex items-center gap-1.5 mt-1.5 px-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors">
              <CornerDownRight size={12} />
              {showReplies ? "Ocultar" : `Ver ${c.replies_count || replies.length} respuesta${(c.replies_count || replies.length) !== 1 ? "s" : ""}`}
              {loadingReplies && <Spinner size="xs" />}
            </button>
          )}
          {showReplies && replies.length > 0 && (
            <div className="ml-4 mt-2 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              {replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} entityId={entityId} api={api} onDelete={onDelete} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

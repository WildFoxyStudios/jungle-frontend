"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, ThumbsUp, Reply, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { commentsApi } from "@/lib/api-posts";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Comment } from "@/lib/types";

interface CommentSectionProps {
  postId: string;
  onCountChange?: (count: number) => void;
}

export function CommentSection({ postId, onCountChange }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    commentsApi.getComments(postId)
      .then(c => { setComments(c); onCountChange?.(c.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const submit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const c = await commentsApi.createComment(postId, {
        content: content.trim(),
        parent_comment_id: replyTo?.id,
      });
      setComments(prev => [c, ...prev]);
      onCountChange?.(comments.length + 1);
      setContent("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: string) => {
    await commentsApi.deleteComment(id);
    setComments(prev => prev.filter(c => c.id !== id));
    onCountChange?.(comments.length - 1);
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex items-start gap-2">
        <Avatar
          src={user?.profile_picture_url}
          alt={user?.full_name}
          size="sm"
          fallbackName={user?.full_name ?? user?.username}
        />
        <div className="flex-1 relative">
          {replyTo && (
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
              Respondiendo a {replyTo.user_name} ·{" "}
              <button onClick={() => setReplyTo(null)} className="hover:underline">
                cancelar
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder={
                replyTo
                  ? `Responder a ${replyTo.user_name}...`
                  : "Escribe un comentario..."
              }
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              onClick={submit}
              disabled={!content.trim() || submitting}
              className={cn(
                "text-indigo-600 transition-colors",
                !content.trim() || submitting
                  ? "opacity-40"
                  : "hover:text-indigo-800",
              )}
            >
              {submitting ? <Spinner size="xs" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}

      {!loading &&
        comments.map(c => (
          <CommentItem
            key={c.id}
            comment={c}
            currentUserId={user?.id ?? ""}
            onDelete={deleteComment}
            onReply={setReplyTo}
          />
        ))}
    </div>
  );
}

function CommentItem({
  comment: c,
  currentUserId,
  onDelete,
  onReply,
}: {
  comment: Comment;
  currentUserId: string;
  onDelete: (id: string) => void;
  onReply: (c: Comment) => void;
}) {
  const [liked, setLiked] = useState(false);
  const isOwner = c.user_id === currentUserId;

  return (
    <div className="flex items-start gap-2 animate-fade-in">
      <Link href={`/profile/${c.user_id}`}>
        <Avatar
          src={c.user_picture}
          alt={c.user_name}
          size="sm"
          fallbackName={c.user_name}
        />
      </Link>
      <div className="flex-1">
        <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl px-3.5 py-2.5 inline-block max-w-full">
          <Link
            href={`/profile/${c.user_id}`}
            className="text-xs font-bold text-slate-900 dark:text-slate-50 hover:underline"
          >
            {c.user_name}
          </Link>
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">
            {c.content}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-2">
          <span className="text-[11px] text-slate-400">
            {formatDistanceToNow(new Date(c.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
          <button
            onClick={() => setLiked(v => !v)}
            className={cn(
              "text-[11px] font-bold transition-colors flex items-center gap-1",
              liked
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <ThumbsUp size={11} />
            Me gusta
            {c.reactions_count > 0 && (
              <span className="ml-0.5">{c.reactions_count}</span>
            )}
          </button>
          <button
            onClick={() => onReply(c)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <Reply size={11} />
            Responder
          </button>
          {isOwner && (
            <button
              onClick={() => onDelete(c.id)}
              className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 size={11} />
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

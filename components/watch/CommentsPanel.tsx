"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { CommentSection, type CommentApiAdapter } from "@/components/feed/comment-section";
import { watchApi } from "@/lib/api-watch";

export interface CommentsPanelProps {
  videoId: string;
  commentsCount: number;
}

/**
 * Comments panel for the Watch expanded player.
 * Reuses the shared CommentSection component with a watch-specific API adapter.
 * Tracks comment count locally for optimistic updates.
 */
export function CommentsPanel({ videoId, commentsCount }: CommentsPanelProps) {
  const [localCount, setLocalCount] = useState(commentsCount);

  // Sync local count when prop changes (new video loaded)
  useEffect(() => {
    setLocalCount(commentsCount);
  }, [commentsCount]);

  // Create adapter for watch video comments
  const watchCommentsAdapter: CommentApiAdapter = useMemo(() => ({
    getComments: (id, limit, offset) =>
      watchApi.getVideoComments(id, { limit, offset }),
    createComment: (id, data) =>
      watchApi.commentOnVideo(id, { 
        content: data.content, 
        parent_comment_id: data.parent_comment_id 
      }),
    deleteComment: async () => {
      // Watch API doesn't have delete comment yet
    },
  }), []);

  // Handle count changes from CommentSection
  const handleCountChange = useCallback((count: number) => {
    setLocalCount(count);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <MessageCircle size={18} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Comentarios ({localCount})
        </h3>
      </div>

      {/* Reuse shared CommentSection */}
      <CommentSection
        entityId={videoId}
        api={watchCommentsAdapter}
        variant="panel"
        onCountChange={handleCountChange}
      />
    </div>
  );
}

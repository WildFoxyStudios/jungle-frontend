"use client";

import { MessageCircle } from "lucide-react";
import { CommentSection, type CommentApiAdapter } from "@/components/feed/comment-section";
import { watchApi } from "@/lib/api-watch";

/** Adapter that maps watch video API to the generic CommentApiAdapter */
const watchCommentsAdapter: CommentApiAdapter = {
  getComments: (videoId, limit, offset) =>
    watchApi.getVideoComments(videoId, { limit, offset }),
  createComment: (videoId, data) =>
    watchApi.commentOnVideo(videoId, { content: data.content, parent_comment_id: data.parent_comment_id }),
  deleteComment: async () => {
    // Watch API doesn't have delete comment yet
  },
};

export interface CommentsPanelProps {
  videoId: string;
  commentsCount: number;
}

/**
 * Comments panel for the Watch expanded player.
 * Reuses the shared CommentSection component with a watch-specific API adapter.
 */
export function CommentsPanel({ videoId, commentsCount }: CommentsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <MessageCircle size={18} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Comentarios ({commentsCount})
        </h3>
      </div>

      {/* Reuse shared CommentSection */}
      <CommentSection
        entityId={videoId}
        api={watchCommentsAdapter}
        variant="panel"
      />
    </div>
  );
}

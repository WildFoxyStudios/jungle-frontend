import { api } from "./api";
import type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  Comment,
  CreateCommentPayload,
  Share,
  PostReaction,
  ReactionSummary,
  ReactionListItem,
} from "./types";

// ─── Re-export types so existing imports don't break ─────────────────────────
export type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  Comment,
  CreateCommentPayload,
  Share,
  PostReaction,
  ReactionSummary,
  ReactionListItem,
};

// ─── Legacy aliases (backwards compat) ───────────────────────────────────────
export type CreatePostData = CreatePostPayload;
export type UpdatePostData = UpdatePostPayload;
export type CreateCommentData = CreateCommentPayload;

// ─── Additional payload types ─────────────────────────────────────────────────

export interface SharePostRequest {
  shared_with_comment?: string;
  visibility?: string;
}

export interface ReportPostRequest {
  reason: string;
  description?: string;
}

// ─── Posts API ────────────────────────────────────────────────────────────────

export const postsApi = {
  /** POST /posts */
  createPost: (data: CreatePostPayload): Promise<Post> =>
    api.post<Post>("/posts", data).then((r) => r.data),

  /** GET /posts/feed */
  getFeed: (limit = 20, offset = 0): Promise<Post[]> =>
    api
      .get<Post[]>("/posts/feed", { params: { limit, offset } })
      .then((r) => r.data),

  /** GET /posts/trending */
  getTrending: (limit = 20, offset = 0): Promise<Post[]> =>
    api
      .get<Post[]>("/posts/trending", { params: { limit, offset } })
      .then((r) => r.data),

  /** GET /posts/:id */
  getPost: (postId: string): Promise<Post> =>
    api.get<Post>(`/posts/${postId}`).then((r) => r.data),

  /** PUT /posts/:id */
  updatePost: (postId: string, data: UpdatePostPayload): Promise<Post> =>
    api.put<Post>(`/posts/${postId}`, data).then((r) => r.data),

  /** DELETE /posts/:id */
  deletePost: (postId: string): Promise<void> =>
    api.delete(`/posts/${postId}`).then(() => undefined),

  /** POST /posts/:id/pin */
  pinPost: (postId: string): Promise<Post> =>
    api.post<Post>(`/posts/${postId}/pin`).then((r) => r.data),

  /** POST /posts/:id/save */
  savePost: (postId: string): Promise<void> =>
    api.post(`/posts/${postId}/save`).then(() => undefined),

  /** DELETE /posts/:id/save */
  unsavePost: (postId: string): Promise<void> =>
    api.delete(`/posts/${postId}/save`).then(() => undefined),

  /** GET /posts/saved */
  getSavedPosts: (limit = 20, offset = 0): Promise<Post[]> =>
    api
      .get<Post[]>("/posts/saved", { params: { limit, offset } })
      .then((r) => r.data),

  /** POST /posts/:id/hide */
  hidePost: (postId: string): Promise<void> =>
    api.post(`/posts/${postId}/hide`).then(() => undefined),

  /** POST /posts/:id/report */
  reportPost: (
    postId: string,
    reason: string,
    description?: string,
  ): Promise<void> =>
    api
      .post(`/posts/${postId}/report`, { reason, description })
      .then(() => undefined),

  /** GET /posts/user/:userId */
  getUserPosts: (userId: string, limit = 20, offset = 0): Promise<Post[]> =>
    api
      .get<Post[]>(`/posts/user/${userId}`, { params: { limit, offset } })
      .then((r) => r.data),

  /** POST /posts/:id/archive */
  archivePost: (postId: string): Promise<void> =>
    api.post(`/posts/${postId}/archive`).then(() => undefined),

  /** POST /posts/:id/unarchive */
  unarchivePost: (postId: string): Promise<void> =>
    api.post(`/posts/${postId}/unarchive`).then(() => undefined),

  /** GET /posts/archived */
  getArchivedPosts: (limit = 20, offset = 0): Promise<Post[]> =>
    api
      .get<Post[]>("/posts/archived", { params: { limit, offset } })
      .then((r) => r.data),
};

// ─── Reactions API ────────────────────────────────────────────────────────────

export const reactionsApi = {
  /** POST /posts/:id/reactions */
  reactToPost: (postId: string, reactionType: string): Promise<PostReaction> =>
    api
      .post<PostReaction>(`/posts/${postId}/reactions`, {
        reaction_type: reactionType,
      })
      .then((r) => r.data),

  /** DELETE /posts/:id/reactions */
  removeReaction: (postId: string): Promise<void> =>
    api.delete(`/posts/${postId}/reactions`).then(() => undefined),

  /** GET /posts/:id/reactions */
  getPostReactions: (
    postId: string,
    limit = 50,
    offset = 0,
    reactionType?: string,
  ): Promise<ReactionListItem[]> =>
    api
      .get<ReactionListItem[]>(`/posts/${postId}/reactions`, {
        params: { limit, offset, reaction_type: reactionType },
      })
      .then((r) => r.data),

  /** GET /posts/:id/reactions/summary */
  getReactionsSummary: (postId: string): Promise<ReactionSummary> =>
    api
      .get<ReactionSummary>(`/posts/${postId}/reactions/summary`)
      .then((r) => r.data),
};

// ─── Comments API ─────────────────────────────────────────────────────────────

export const commentsApi = {
  /** POST /posts/:id/comments */
  createComment: (
    postId: string,
    data: CreateCommentPayload,
  ): Promise<Comment> =>
    api.post<Comment>(`/posts/${postId}/comments`, data).then((r) => r.data),

  /** GET /posts/:id/comments */
  getComments: (postId: string, limit = 20, offset = 0): Promise<Comment[]> =>
    api
      .get<
        Comment[]
      >(`/posts/${postId}/comments`, { params: { limit, offset } })
      .then((r) => r.data),

  /** GET /comments/:id/replies */
  getReplies: (commentId: string, limit = 20, offset = 0): Promise<Comment[]> =>
    api
      .get<
        Comment[]
      >(`/comments/${commentId}/replies`, { params: { limit, offset } })
      .then((r) => r.data),

  /** PUT /comments/:id */
  updateComment: (commentId: string, content: string): Promise<Comment> =>
    api.put<Comment>(`/comments/${commentId}`, { content }).then((r) => r.data),

  /** DELETE /comments/:id */
  deleteComment: (commentId: string): Promise<void> =>
    api.delete(`/comments/${commentId}`).then(() => undefined),

  /** POST /comments/:id/reactions */
  reactToComment: (commentId: string, reactionType: string): Promise<void> =>
    api
      .post(`/comments/${commentId}/reactions`, { reaction_type: reactionType })
      .then(() => undefined),

  /** DELETE /comments/:id/reactions */
  removeCommentReaction: (commentId: string): Promise<void> =>
    api.delete(`/comments/${commentId}/reactions`).then(() => undefined),

  /** GET /comments/:id/reactions */
  getCommentReactions: (commentId: string): Promise<ReactionListItem[]> =>
    api
      .get<ReactionListItem[]>(`/comments/${commentId}/reactions`)
      .then((r) => r.data),
};

// ─── Shares API ───────────────────────────────────────────────────────────────

export const sharesApi = {
  /** POST /posts/:id/share */
  sharePost: (
    postId: string,
    sharedWithComment?: string,
    visibility = "public",
  ): Promise<Share> =>
    api
      .post<Share>(`/posts/${postId}/share`, {
        shared_with_comment: sharedWithComment,
        visibility,
      })
      .then((r) => r.data),

  /** GET /posts/:id/shares */
  getPostShares: (postId: string): Promise<Share[]> =>
    api.get<Share[]>(`/posts/${postId}/shares`).then((r) => r.data),

  /** DELETE /shares/:id */
  deleteShare: (shareId: string): Promise<void> =>
    api.delete(`/shares/${shareId}`).then(() => undefined),
};

import { api } from "./api";
import type { Reel, ReelComment } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateReelPayload {
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  duration: number;
  file_size?: number;
  audio_url?: string;
  audio_name?: string;
  filter_name?: string;
  is_public?: boolean;
  allow_comments?: boolean;
}

export interface CreateReelCommentPayload {
  content: string;
  parent_comment_id?: string;
}

export interface RecordReelViewPayload {
  watch_time?: number;
  completed?: boolean;
}

export interface ReelFeedQuery {
  limit?: number;
  offset?: number;
  hashtag?: string;
}

export interface ReelPaginationQuery {
  limit?: number;
  offset?: number;
}

// ─── Reels API ────────────────────────────────────────────────────────────────

export const reelsApi = {
  // ── Feed ────────────────────────────────────────────────────────────────────

  /** GET /reels/feed – personalised reel feed for the authenticated user */
  getFeed: (params?: ReelFeedQuery) =>
    api.get<Reel[]>("/reels/feed", { params }).then((r) => r.data),

  /** GET /reels/trending – top reels by engagement score */
  getTrending: (params?: ReelPaginationQuery) =>
    api.get<Reel[]>("/reels/trending", { params }).then((r) => r.data),

  /** GET /reels/user/:userId – reels published by a specific user */
  getUserReels: (userId: string, params?: ReelPaginationQuery) =>
    api
      .get<Reel[]>(`/reels/user/${userId}`, { params })
      .then((r) => r.data),

  // ── Single reel ─────────────────────────────────────────────────────────────

  /** GET /reels/:id */
  get: (reelId: string) =>
    api.get<Reel>(`/reels/${reelId}`).then((r) => r.data),

  /** POST /reels */
  create: (payload: CreateReelPayload) =>
    api.post<Reel>("/reels", payload).then((r) => r.data),

  /** DELETE /reels/:id */
  delete: (reelId: string) =>
    api.delete(`/reels/${reelId}`).then((r) => r.data),

  // ── Engagement ──────────────────────────────────────────────────────────────

  /** POST /reels/:id/like */
  like: (reelId: string) =>
    api.post(`/reels/${reelId}/like`).then((r) => r.data),

  /** DELETE /reels/:id/like */
  unlike: (reelId: string) =>
    api.delete(`/reels/${reelId}/like`).then((r) => r.data),

  /** POST /reels/:id/save */
  save: (reelId: string) =>
    api.post(`/reels/${reelId}/save`).then((r) => r.data),

  /** DELETE /reels/:id/save */
  unsave: (reelId: string) =>
    api.delete(`/reels/${reelId}/save`).then((r) => r.data),

  /** POST /reels/:id/view – record a view + optionally watch time */
  recordView: (reelId: string, payload?: RecordReelViewPayload) =>
    api.post(`/reels/${reelId}/view`, payload ?? {}).then((r) => r.data),

  // ── Comments ────────────────────────────────────────────────────────────────

  /** GET /reels/:id/comments */
  getComments: (reelId: string, params?: ReelPaginationQuery) =>
    api
      .get<ReelComment[]>(`/reels/${reelId}/comments`, { params })
      .then((r) => r.data),

  /** POST /reels/:id/comment */
  createComment: (reelId: string, payload: CreateReelCommentPayload) =>
    api.post(`/reels/${reelId}/comment`, payload).then((r) => r.data),
};

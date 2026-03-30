import { api } from "./api";
import type { WatchVideo } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateVideoPayload {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  category?: string;
  is_public?: boolean;
  allow_comments?: boolean;
}

export interface RecordViewPayload {
  watch_time?: number;
  watch_percentage?: number;
  completed?: boolean;
}

export interface CommentOnVideoPayload {
  content: string;
  parent_comment_id?: string;
  timestamp?: number;
}

export interface VideoFeedQuery {
  category?: string;
  limit?: number;
  offset?: number;
}

// ─── Watch API ────────────────────────────────────────────────────────────────

export const watchApi = {
  // ── Feed / Discovery ────────────────────────────────────────────────────────

  /** GET /watch/feed – personalised feed based on watch history */
  getFeed: (params?: VideoFeedQuery) =>
    api.get<WatchVideo[]>("/watch/feed", { params }).then((r) => r.data),

  /** GET /watch/trending – most-viewed videos */
  getTrending: (params?: { limit?: number }) =>
    api.get<WatchVideo[]>("/watch/trending", { params }).then((r) => r.data),

  /** GET /watch/subscriptions – videos from subscribed creators */
  getSubscriptions: (params?: { limit?: number; offset?: number }) =>
    api
      .get<WatchVideo[]>("/watch/subscriptions", { params })
      .then((r) => r.data),

  /** GET /watch/history – videos the user has watched */
  getHistory: (params?: { limit?: number; offset?: number }) =>
    api.get<WatchVideo[]>("/watch/history", { params }).then((r) => r.data),

  /** GET /watch/user/:userId – videos uploaded by a specific user */
  getUserVideos: (
    userId: string,
    params?: { limit?: number; offset?: number },
  ) =>
    api
      .get<WatchVideo[]>(`/watch/user/${userId}`, { params })
      .then((r) => r.data),

  // ── Single video ────────────────────────────────────────────────────────────

  /** GET /watch/:id */
  getVideo: (videoId: string) =>
    api.get<WatchVideo>(`/watch/${videoId}`).then((r) => r.data),

  // ── CRUD ────────────────────────────────────────────────────────────────────

  /** POST /watch */
  createVideo: (payload: CreateVideoPayload) =>
    api.post<WatchVideo>("/watch", payload).then((r) => r.data),

  /** DELETE /watch/:id */
  deleteVideo: (videoId: string) =>
    api.delete(`/watch/${videoId}`).then((r) => r.data),

  // ── Interactions ────────────────────────────────────────────────────────────

  /** POST /watch/:id/like */
  likeVideo: (videoId: string) =>
    api.post(`/watch/${videoId}/like`).then((r) => r.data),

  /** DELETE /watch/:id/like */
  unlikeVideo: (videoId: string) =>
    api.delete(`/watch/${videoId}/like`).then((r) => r.data),

  /** POST /watch/:id/comment */
  commentOnVideo: (videoId: string, payload: CommentOnVideoPayload) =>
    api.post(`/watch/${videoId}/comment`, payload).then((r) => r.data),

  /** GET /watch/saved – videos the user has saved */
  getSavedVideos: (params?: { limit?: number; offset?: number }) =>
    api.get<WatchVideo[]>("/watch/saved", { params }).then((r) => r.data),

  /** GET /watch/:id/comments – comments on a video */
  getVideoComments: (videoId: string, params?: { limit?: number; offset?: number }) =>
    api.get<any[]>(`/watch/${videoId}/comments`, { params }).then((r) => r.data),

  /** POST /watch/:id/save */
  saveVideo: (videoId: string) =>
    api.post(`/watch/${videoId}/save`).then((r) => r.data),

  /** DELETE /watch/:id/save */
  unsaveVideo: (videoId: string) =>
    api.delete(`/watch/${videoId}/save`).then((r) => r.data),

  /** POST /watch/:id/view */
  recordView: (videoId: string, payload: RecordViewPayload) =>
    api.post(`/watch/${videoId}/view`, payload).then((r) => r.data),

  // ── Creator subscriptions ───────────────────────────────────────────────────

  /** POST /watch/creators/:creatorId/subscribe */
  subscribeToCreator: (creatorId: string) =>
    api.post(`/watch/creators/${creatorId}/subscribe`).then((r) => r.data),

  /** DELETE /watch/creators/:creatorId/unsubscribe */
  unsubscribeFromCreator: (creatorId: string) =>
    api
      .delete(`/watch/creators/${creatorId}/unsubscribe`)
      .then((r) => r.data),
};

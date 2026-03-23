import { api } from "./api";
import type { LiveStream, StreamComment } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateStreamPayload {
  title: string;
  description?: string;
  thumbnail_url?: string;
  scheduled_start?: string;
}

export interface CommentOnStreamPayload {
  content: string;
}

export interface ReactToStreamPayload {
  reaction_type: string;
}

export interface StreamReactionCount {
  reaction_type: string;
  count: number;
}

// ─── Streaming API ────────────────────────────────────────────────────────────

export const streamingApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /streams/live – all currently live streams ordered by viewers */
  getLive: (params?: { limit?: number; offset?: number }) =>
    api.get<LiveStream[]>("/streams/live", { params }).then((r) => r.data),

  // ── Stream lifecycle ──────────────────────────────────────────────────────

  /** POST /streams – create / schedule a new live stream */
  create: (payload: CreateStreamPayload) =>
    api.post<LiveStream>("/streams", payload).then((r) => r.data),

  /** POST /streams/:id/start – transition status → live */
  start: (streamId: string) =>
    api.post(`/streams/${streamId}/start`).then((r) => r.data),

  /** POST /streams/:id/end – transition status → ended */
  end: (streamId: string) =>
    api.post(`/streams/${streamId}/end`).then((r) => r.data),

  // ── Viewer actions ────────────────────────────────────────────────────────

  /** POST /streams/:id/join – increment viewer count */
  join: (streamId: string) =>
    api.post(`/streams/${streamId}/join`).then((r) => r.data),

  /** POST /streams/:id/leave – decrement viewer count */
  leave: (streamId: string) =>
    api.post(`/streams/${streamId}/leave`).then((r) => r.data),

  // ── Comments ──────────────────────────────────────────────────────────────

  /** GET /streams/:id/comments */
  getComments: (streamId: string) =>
    api
      .get<StreamComment[]>(`/streams/${streamId}/comments`)
      .then((r) => r.data),

  /** POST /streams/:id/comments */
  comment: (streamId: string, payload: CommentOnStreamPayload) =>
    api
      .post<StreamComment>(`/streams/${streamId}/comments`, payload)
      .then((r) => r.data),

  // ── Reactions ─────────────────────────────────────────────────────────────

  /** GET /streams/:id/reactions – grouped reaction counts */
  getReactions: (streamId: string) =>
    api
      .get<StreamReactionCount[]>(`/streams/${streamId}/reactions`)
      .then((r) => r.data),

  /** POST /streams/:id/reactions */
  react: (streamId: string, payload: ReactToStreamPayload) =>
    api.post(`/streams/${streamId}/reactions`, payload).then((r) => r.data),
};

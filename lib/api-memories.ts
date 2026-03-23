import { api } from "./api";
import type { MemoryWithPost, MemoryPreferences } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface ShareMemoryPayload {
  comment?: string;
}

export interface UpdateMemoryPreferencesPayload {
  enabled?: boolean;
  show_notifications?: boolean;
  min_years_ago?: number;
}

export interface MemoriesPaginationQuery {
  limit?: number;
  offset?: number;
}

// ─── Memories API ─────────────────────────────────────────────────────────────

export const memoriesApi = {
  // ── Listing ──────────────────────────────────────────────────────────────────

  /** GET /memories/today – memories for today (same day/month in past years) */
  getToday: () =>
    api.get<MemoryWithPost[]>("/memories/today").then((r) => r.data),

  /** GET /memories – all memories for the authenticated user */
  getAll: (params?: MemoriesPaginationQuery) =>
    api.get<MemoryWithPost[]>("/memories", { params }).then((r) => r.data),

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** POST /memories/:id/view – mark a memory as viewed */
  markViewed: (memoryId: string) =>
    api.post(`/memories/${memoryId}/view`).then((r) => r.data),

  /**
   * POST /memories/:id/share – reshare a memory as a new post.
   * Returns { post_id: string; message: string }
   */
  share: (memoryId: string, payload?: ShareMemoryPayload) =>
    api
      .post<{ post_id: string; message: string }>(
        `/memories/${memoryId}/share`,
        payload ?? {},
      )
      .then((r) => r.data),

  // ── Preferences ──────────────────────────────────────────────────────────────

  /** GET /memories/preferences */
  getPreferences: () =>
    api.get<MemoryPreferences>("/memories/preferences").then((r) => r.data),

  /** PUT /memories/preferences */
  updatePreferences: (payload: UpdateMemoryPreferencesPayload) =>
    api
      .put<MemoryPreferences>("/memories/preferences", payload)
      .then((r) => r.data),
};

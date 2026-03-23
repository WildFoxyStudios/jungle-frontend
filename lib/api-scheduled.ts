import { api } from "./api";
import type { ScheduledPost } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateScheduledPostPayload {
  content_type: "post" | "story" | "reel";
  content: string;
  media_urls?: string[];
  post_config?: Record<string, unknown>;
  scheduled_for: string; // ISO 8601 datetime string (must be in the future)
  timezone?: string;     // e.g. "America/Mexico_City" – defaults to "UTC"
}

export interface UpdateScheduledPostPayload {
  content?: string;
  media_urls?: string[];
  post_config?: Record<string, unknown>;
  scheduled_for?: string;
  timezone?: string;
}

export interface ScheduledPostsQuery {
  limit?: number;
  offset?: number;
}

// ─── Scheduled Posts API ──────────────────────────────────────────────────────

export const scheduledApi = {
  // ── Listing ───────────────────────────────────────────────────────────────

  /**
   * GET /scheduled
   * Returns all pending scheduled posts for the authenticated user,
   * ordered by scheduled_for ascending (next to publish first).
   */
  list: (params?: ScheduledPostsQuery): Promise<ScheduledPost[]> =>
    api.get<ScheduledPost[]>("/scheduled", { params }).then((r) => r.data),

  /**
   * GET /scheduled/:id
   * Returns a single scheduled post by ID.
   * Only the owning user can access it.
   */
  get: (postId: string): Promise<ScheduledPost> =>
    api.get<ScheduledPost>(`/scheduled/${postId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * POST /scheduled
   * Schedule a post, story, or reel for future publication.
   * `scheduled_for` must be a future datetime; the backend validates this.
   *
   * When the scheduled time arrives, a background worker automatically
   * publishes the content and updates `status` to "published".
   */
  create: (payload: CreateScheduledPostPayload): Promise<ScheduledPost> =>
    api.post<ScheduledPost>("/scheduled", payload).then((r) => r.data),

  /**
   * PUT /scheduled/:id
   * Update the content or scheduled time of a pending post.
   * Cannot update a post that has already been published or cancelled.
   *
   * `scheduled_for` (if provided) must be a future datetime.
   */
  update: (
    postId: string,
    payload: UpdateScheduledPostPayload,
  ): Promise<ScheduledPost> =>
    api
      .put<ScheduledPost>(`/scheduled/${postId}`, payload)
      .then((r) => r.data),

  /**
   * DELETE /scheduled/:id
   * Permanently delete a scheduled post (only if status is "pending"
   * or "cancelled"). Published posts cannot be deleted through this endpoint.
   */
  delete: (postId: string): Promise<void> =>
    api.delete(`/scheduled/${postId}`).then(() => undefined),

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * POST /scheduled/:id/cancel
   * Cancel a pending scheduled post without deleting it.
   * The post remains in the list with status "cancelled" for reference.
   * A cancelled post cannot be re-scheduled – create a new one instead.
   */
  cancel: (postId: string): Promise<void> =>
    api.post(`/scheduled/${postId}/cancel`).then(() => undefined),
};

import { api } from "./api";
import type { FeedItem, FeedPreferences } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface FeedQuery {
  limit?: number;
  offset?: number;
}

export interface TrackInteractionPayload {
  entity_type: string;
  entity_id: string;
  interaction_type: "view" | "like" | "comment" | "share" | "click" | "scroll_past";
  duration_seconds?: number;
}

export interface UpdateFeedPreferencesPayload {
  posts_weight?: number;
  reels_weight?: number;
  videos_weight?: number;
  stories_weight?: number;
  memories_weight?: number;
  friends_weight?: number;
  pages_weight?: number;
  groups_weight?: number;
  show_suggested?: boolean;
  chronological_mode?: boolean;
}

// ─── Feed API ─────────────────────────────────────────────────────────────────

export const feedApi = {
  // ── Feed ──────────────────────────────────────────────────────────────────

  /**
   * GET /feed/personalized
   * Returns a mixed feed of posts, reels, and watch videos scored by the
   * backend algorithm. Each item includes a `type` discriminator.
   */
  getPersonalized: (params?: FeedQuery) =>
    api
      .get<FeedItem[]>("/feed/personalized", { params })
      .then((r) => r.data),

  // ── Interaction tracking ──────────────────────────────────────────────────

  /**
   * POST /feed/track
   * Records a user interaction so the algorithm can improve future scores.
   * Fire-and-forget: errors are silently swallowed by the caller.
   */
  trackInteraction: (payload: TrackInteractionPayload) =>
    api.post("/feed/track", payload).then((r) => r.data),

  // ── Preferences ───────────────────────────────────────────────────────────

  /** GET /feed/preferences */
  getPreferences: () =>
    api.get<FeedPreferences>("/feed/preferences").then((r) => r.data),

  /** PUT /feed/preferences */
  updatePreferences: (payload: UpdateFeedPreferencesPayload) =>
    api
      .put<FeedPreferences>("/feed/preferences", payload)
      .then((r) => r.data),
};

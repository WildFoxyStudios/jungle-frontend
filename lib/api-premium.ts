import { api } from "./api";
import type { BoostedPost, Subscription, SubscriptionTier } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateBoostPayload {
  post_id: string;
  budget: number;
  duration_days: number;
  objective?: "engagement" | "reach" | "clicks" | "followers";
  target_audience?: {
    age_min?: number;
    age_max?: number;
    interests?: string[];
    locations?: string[];
  };
}

export interface SubscribePayload {
  tier?: string;
}

export interface CreateSubscriptionTierPayload {
  name: string;
  description?: string;
  price: number;
  benefits: string[];
}

// ─── Premium / Boosts API ─────────────────────────────────────────────────────

export const boostsApi = {
  /**
   * POST /boosts
   * Promote a post by specifying a budget and duration.
   * Returns the created BoostedPost with initial metrics (impressions = 0).
   */
  create: (payload: CreateBoostPayload): Promise<BoostedPost> =>
    api.post<BoostedPost>("/boosts", payload).then((r) => r.data),

  /**
   * GET /boosts/my
   * List all boosted posts created by the authenticated user,
   * including spend and performance metrics.
   */
  getMy: (): Promise<BoostedPost[]> =>
    api.get<BoostedPost[]>("/boosts/my").then((r) => r.data),

  /**
   * POST /boosts/:id/pause
   * Pause an active boost campaign.
   */
  pause: (boostId: string): Promise<void> =>
    api.post(`/boosts/${boostId}/pause`).then(() => undefined),

  /**
   * POST /boosts/:id/resume
   * Resume a paused boost campaign.
   */
  resume: (boostId: string): Promise<void> =>
    api.post(`/boosts/${boostId}/resume`).then(() => undefined),
};

// ─── Creator Subscriptions API ────────────────────────────────────────────────

export const subscriptionsApi = {
  /**
   * POST /subscriptions/creator/:creatorId
   * Subscribe to a creator's content.
   * Optionally specify a tier (defaults to "basic" on the backend).
   */
  subscribe: (creatorId: string, payload?: SubscribePayload): Promise<Subscription> =>
    api
      .post<Subscription>(`/subscriptions/creator/${creatorId}`, payload ?? {})
      .then((r) => r.data),

  /**
   * DELETE /subscriptions/creator/:creatorId
   * Cancel a subscription to a creator.
   */
  unsubscribe: (creatorId: string): Promise<void> =>
    api.delete(`/subscriptions/creator/${creatorId}`).then(() => undefined),

  /**
   * GET /subscriptions/my
   * List all active subscriptions the authenticated user has to other creators.
   */
  getMy: (): Promise<Subscription[]> =>
    api.get<Subscription[]>("/subscriptions/my").then((r) => r.data),

  /**
   * GET /subscriptions/subscribers
   * List all active subscribers to the authenticated user's content.
   * Only meaningful for creator accounts.
   */
  getSubscribers: (): Promise<Subscription[]> =>
    api.get<Subscription[]>("/subscriptions/subscribers").then((r) => r.data),
};

// ─── Subscription Tiers API ───────────────────────────────────────────────────

export const tiersApi = {
  /**
   * GET /subscription-tiers/creator/:creatorId
   * Fetch the public subscription tiers offered by a creator.
   * Accessible without authentication.
   */
  getCreatorTiers: (creatorId: string): Promise<SubscriptionTier[]> =>
    api
      .get<SubscriptionTier[]>(`/subscription-tiers/creator/${creatorId}`)
      .then((r) => r.data),

  /**
   * POST /subscription-tiers
   * Create a new subscription tier for the authenticated creator.
   * Tiers define the price and benefits subscribers receive.
   */
  create: (payload: CreateSubscriptionTierPayload): Promise<SubscriptionTier> =>
    api
      .post<SubscriptionTier>("/subscription-tiers", payload)
      .then((r) => r.data),
};

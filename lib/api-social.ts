import { api } from "./api";
import type { Poke, CheckIn } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateCheckInPayload {
  place_name: string;
  latitude?: number;
  longitude?: number;
  post_id?: string;
}

export interface SaveSearchPayload {
  query: string;
  search_type?: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  query: string;
  search_type?: string;
  created_at: string;
}

export interface MutualFriend {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
}

export interface UpcomingBirthday {
  user_id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  birth_date: string;
  days_until: number;
}

export interface BlockedUser {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  blocked_at: string;
}

// ─── Social Features API ──────────────────────────────────────────────────────

// ── Pokes ─────────────────────────────────────────────────────────────────────

export const pokesApi = {
  /**
   * POST /pokes/:userId
   * Poke another user. If the target user has already poked the caller,
   * the poke becomes mutual.
   */
  poke: (userId: string): Promise<Poke> =>
    api.post<Poke>(`/pokes/${userId}`).then((r) => r.data),

  /**
   * POST /pokes/:id/back
   * Poke back in response to a received poke.
   */
  pokeBack: (pokeId: string): Promise<Poke> =>
    api.post<Poke>(`/pokes/${pokeId}/back`).then((r) => r.data),

  /**
   * GET /pokes
   * Returns all pokes received by the authenticated user that haven't
   * been poked back yet.
   */
  getReceived: (): Promise<Poke[]> =>
    api.get<Poke[]>("/pokes").then((r) => r.data),
};

// ── Close Friends ──────────────────────────────────────────────────────────────

export const closeFriendsApi = {
  /**
   * GET /close-friends
   * Returns the authenticated user's close-friends list.
   * Stories marked as "close_friends" are only visible to users on this list.
   */
  list: (): Promise<MutualFriend[]> =>
    api.get<MutualFriend[]>("/close-friends").then((r) => r.data),

  /**
   * POST /close-friends/:friendId
   * Add a friend to the close-friends list.
   */
  add: (friendId: string): Promise<void> =>
    api.post(`/close-friends/${friendId}`).then(() => undefined),

  /**
   * DELETE /close-friends/:friendId
   * Remove a friend from the close-friends list.
   */
  remove: (friendId: string): Promise<void> =>
    api.delete(`/close-friends/${friendId}`).then(() => undefined),
};

// ── Acquaintances ──────────────────────────────────────────────────────────────

export const acquaintancesApi = {
  /**
   * GET /acquaintances
   * Returns the authenticated user's acquaintances list.
   * Acquaintances see fewer posts in the feed by default.
   */
  list: (): Promise<MutualFriend[]> =>
    api.get<MutualFriend[]>("/acquaintances").then((r) => r.data),

  /**
   * POST /acquaintances/:userId
   * Mark a user as an acquaintance.
   */
  add: (userId: string): Promise<void> =>
    api.post(`/acquaintances/${userId}`).then(() => undefined),

  /**
   * DELETE /acquaintances/:userId
   * Remove a user from the acquaintances list.
   */
  remove: (userId: string): Promise<void> =>
    api.delete(`/acquaintances/${userId}`).then(() => undefined),
};

// ── Check-ins ──────────────────────────────────────────────────────────────────

export const checkInsApi = {
  /**
   * POST /check-ins
   * Create a location check-in. Optionally associates it with a post.
   */
  create: (payload: CreateCheckInPayload): Promise<CheckIn> =>
    api.post<CheckIn>("/check-ins", payload).then((r) => r.data),

  /**
   * GET /check-ins/user/:userId
   * Returns all check-ins made by a specific user.
   */
  getUserCheckIns: (
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<CheckIn[]> =>
    api
      .get<CheckIn[]>(`/check-ins/user/${userId}`, { params })
      .then((r) => r.data),
};

// ── Birthdays ──────────────────────────────────────────────────────────────────

export const birthdaysApi = {
  /**
   * GET /birthdays/upcoming
   * Returns friends whose birthdays are coming up soon (next 30 days).
   */
  getUpcoming: (): Promise<UpcomingBirthday[]> =>
    api.get<UpcomingBirthday[]>("/birthdays/upcoming").then((r) => r.data),
};

// ── Mutual Friends ─────────────────────────────────────────────────────────────

export const mutualFriendsApi = {
  /**
   * GET /mutual-friends/:userId
   * Returns the list of mutual friends between the authenticated user
   * and the specified user.
   */
  get: (userId: string): Promise<MutualFriend[]> =>
    api.get<MutualFriend[]>(`/mutual-friends/${userId}`).then((r) => r.data),
};

// ── Block / Unblock ────────────────────────────────────────────────────────────

export const blockApi = {
  /**
   * POST /block/:userId
   * Block a user. Blocked users cannot see your profile, posts, or contact you.
   */
  block: (userId: string): Promise<void> =>
    api.post(`/block/${userId}`).then(() => undefined),

  /**
   * DELETE /block/:userId
   * Unblock a previously blocked user.
   */
  unblock: (userId: string): Promise<void> =>
    api.delete(`/block/${userId}`).then(() => undefined),

  /**
   * GET /blocked
   * Returns the list of users blocked by the authenticated user.
   */
  getBlocked: (): Promise<BlockedUser[]> =>
    api.get<BlockedUser[]>("/blocked").then((r) => r.data),
};

// ── Saved Searches ─────────────────────────────────────────────────────────────

export const savedSearchesApi = {
  /**
   * POST /searches/save
   * Save a search query for quick access later.
   */
  save: (payload: SaveSearchPayload): Promise<SavedSearch> =>
    api.post<SavedSearch>("/searches/save", payload).then((r) => r.data),

  /**
   * GET /searches/saved
   * Returns all saved searches for the authenticated user.
   */
  list: (): Promise<SavedSearch[]> =>
    api.get<SavedSearch[]>("/searches/saved").then((r) => r.data),

  /**
   * DELETE /searches/:id
   * Delete a saved search by ID.
   */
  delete: (searchId: string): Promise<void> =>
    api.delete(`/searches/${searchId}`).then(() => undefined),
};

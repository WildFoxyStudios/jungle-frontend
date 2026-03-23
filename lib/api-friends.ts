import { api } from "./api";
import type {
  Friend,
  FriendSuggestion,
  FriendStats,
  FriendList,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface SendFriendRequestPayload {
  receiver_id?: string;
}

export interface CreateFriendListPayload {
  name: string;
  description?: string;
}

export interface AddToFriendListPayload {
  friend_ids: string[];
}

export interface FriendsQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface MutualFriend {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
}

export interface FriendBirthday {
  user_id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  birth_date: string;
  days_until: number;
}

// ─── Friends API ──────────────────────────────────────────────────────────────

export const friendsApi = {
  // ── Listing ───────────────────────────────────────────────────────────────

  /** GET /friends – list accepted friends with optional search + pagination */
  getFriends: (params?: FriendsQuery): Promise<Friend[]> =>
    api.get<Friend[]>("/friends", { params }).then((r) => r.data),

  /** GET /friends/requests – pending incoming friend requests */
  getFriendRequests: (): Promise<Friend[]> =>
    api.get<Friend[]>("/friends/requests").then((r) => r.data),

  /** GET /friends/suggestions – people the user may know */
  getSuggestions: (params?: { limit?: number }): Promise<FriendSuggestion[]> =>
    api
      .get<FriendSuggestion[]>("/friends/suggestions", { params })
      .then((r) => r.data),

  /** GET /friends/stats – counts for requests, friends, and suggestions */
  getStats: (): Promise<FriendStats> =>
    api.get<FriendStats>("/friends/stats").then((r) => r.data),

  /** GET /friends/birthdays – upcoming birthdays of accepted friends */
  getBirthdays: (): Promise<FriendBirthday[]> =>
    api.get<FriendBirthday[]>("/friends/birthdays").then((r) => r.data),

  /** GET /friends/mutual/:userId – mutual friends between the caller and a user */
  getMutualFriends: (userId: string): Promise<MutualFriend[]> =>
    api.get<MutualFriend[]>(`/friends/mutual/${userId}`).then((r) => r.data),

  // ── Requests ──────────────────────────────────────────────────────────────

  /**
   * POST /friends/request/:friendId
   * Send a friend request to another user.
   */
  sendRequest: (friendId: string): Promise<void> =>
    api.post(`/friends/request/${friendId}`).then(() => undefined),

  /**
   * POST /friends/accept/:friendshipId
   * Accept a pending friend request by its friendship ID.
   */
  acceptRequest: (friendshipId: string): Promise<void> =>
    api.post(`/friends/accept/${friendshipId}`).then(() => undefined),

  /**
   * POST /friends/reject/:friendshipId
   * Decline a pending friend request.
   */
  rejectRequest: (friendshipId: string): Promise<void> =>
    api.post(`/friends/reject/${friendshipId}`).then(() => undefined),

  // ── Friendship management ─────────────────────────────────────────────────

  /**
   * DELETE /friends/unfriend/:friendId
   * Remove an accepted friendship.
   */
  unfriend: (friendId: string): Promise<void> =>
    api.delete(`/friends/unfriend/${friendId}`).then(() => undefined),

  /**
   * POST /friends/block/:userId
   * Block a user. They can no longer see your profile, send requests, or message you.
   */
  blockUser: (userId: string): Promise<void> =>
    api.post(`/friends/block/${userId}`).then(() => undefined),

  /**
   * POST /friends/unblock/:userId
   * Unblock a previously blocked user.
   */
  unblockUser: (userId: string): Promise<void> =>
    api.post(`/friends/unblock/${userId}`).then(() => undefined),

  // ── Suggestions ───────────────────────────────────────────────────────────

  /**
   * POST /friends/suggestions/:suggestionId/dismiss
   * Dismiss a friend suggestion so it won't appear again.
   */
  dismissSuggestion: (suggestionId: string): Promise<void> =>
    api
      .post(`/friends/suggestions/${suggestionId}/dismiss`)
      .then(() => undefined),

  // ── Friend Lists ──────────────────────────────────────────────────────────

  /** GET /friends/lists – all custom friend lists created by the user */
  getFriendLists: (): Promise<FriendList[]> =>
    api.get<FriendList[]>("/friends/lists").then((r) => r.data),

  /** POST /friends/lists – create a new friend list */
  createFriendList: (payload: CreateFriendListPayload): Promise<FriendList> =>
    api.post<FriendList>("/friends/lists", payload).then((r) => r.data),

  /** DELETE /friends/lists/:listId – delete a friend list */
  deleteFriendList: (listId: string): Promise<void> =>
    api.delete(`/friends/lists/${listId}`).then(() => undefined),

  /**
   * POST /friends/lists/:listId/add
   * Add one or more friends to a custom list.
   */
  addToList: (listId: string, payload: AddToFriendListPayload): Promise<void> =>
    api.post(`/friends/lists/${listId}/add`, payload).then(() => undefined),
};

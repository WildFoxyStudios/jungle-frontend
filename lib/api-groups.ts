import { api } from "./api";
import type { Group, GroupMember, GroupPost, MemberRole } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateGroupPayload {
  name: string;
  description?: string;
  privacy?: "public" | "private" | "secret";
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  privacy?: "public" | "private" | "secret";
  picture_url?: string;
  cover_url?: string;
}

export interface CreateGroupPostPayload {
  content: string;
  media_urls?: string[];
}

export interface UpdateGroupPostPayload {
  content?: string;
  media_urls?: string[];
}

export interface InviteToGroupPayload {
  user_ids: string[];
}

export interface UpdateMemberRolePayload {
  role: MemberRole;
}

export interface GroupDiscoveryParams {
  limit?: number;
  offset?: number;
  privacy?: string;
  sort_by?: string;
}

// ─── Groups API ───────────────────────────────────────────────────────────────

export const groupsApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /groups – public groups with optional discovery filters */
  list: (params?: GroupDiscoveryParams) =>
    api.get<Group[]>("/groups", { params }).then((r) => r.data),

  /** GET /groups/my – groups the current user belongs to */
  myGroups: () =>
    api.get<Group[]>("/groups/my").then((r) => r.data),

  /** GET /groups/:id */
  get: (groupId: string) =>
    api.get<Group>(`/groups/${groupId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /groups */
  create: (payload: CreateGroupPayload) =>
    api.post<Group>("/groups", payload).then((r) => r.data),

  /** PUT /groups/:id – update group name/description/privacy/images */
  update: (groupId: string, payload: UpdateGroupPayload) =>
    api.put<Group>(`/groups/${groupId}`, payload).then((r) => r.data),

  /** DELETE /groups/:id – admin only, cascades all data */
  delete: (groupId: string) =>
    api.delete(`/groups/${groupId}`).then((r) => r.data),

  // ── Membership ────────────────────────────────────────────────────────────

  /** POST /groups/:id/join */
  join: (groupId: string) =>
    api.post(`/groups/${groupId}/join`).then((r) => r.data),

  /** POST /groups/:id/leave  (backend uses POST, not DELETE) */
  leave: (groupId: string) =>
    api.post(`/groups/${groupId}/leave`).then((r) => r.data),

  /** POST /groups/:id/invite */
  invite: (groupId: string, payload: InviteToGroupPayload) =>
    api.post(`/groups/${groupId}/invite`, payload).then((r) => r.data),

  // ── Members ───────────────────────────────────────────────────────────────

  /** GET /groups/:id/members */
  getMembers: (groupId: string) =>
    api.get<GroupMember[]>(`/groups/${groupId}/members`).then((r) => r.data),

  /** GET /groups/:id/pending-members */
  getPendingMembers: (groupId: string) =>
    api
      .get<GroupMember[]>(`/groups/${groupId}/pending-members`)
      .then((r) => r.data),

  /** POST /groups/:id/members/:userId/approve */
  approveMember: (groupId: string, userId: string) =>
    api
      .post(`/groups/${groupId}/members/${userId}/approve`)
      .then((r) => r.data),

  /** POST /groups/:id/members/:userId/remove */
  removeMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/members/${userId}/remove`).then((r) => r.data),

  /** PUT /groups/:id/members/:userId/role */
  updateMemberRole: (
    groupId: string,
    userId: string,
    payload: UpdateMemberRolePayload,
  ) =>
    api
      .put(`/groups/${groupId}/members/${userId}/role`, payload)
      .then((r) => r.data),

  // ── Posts ─────────────────────────────────────────────────────────────────

  /** GET /groups/:id/posts */
  getPosts: (groupId: string) =>
    api.get<GroupPost[]>(`/groups/${groupId}/posts`).then((r) => r.data),

  /** POST /groups/:id/posts */
  createPost: (groupId: string, payload: CreateGroupPostPayload) =>
    api
      .post<GroupPost>(`/groups/${groupId}/posts`, payload)
      .then((r) => r.data),

  /** PUT /groups/:id/posts/:postId */
  updatePost: (
    groupId: string,
    postId: string,
    payload: UpdateGroupPostPayload,
  ) =>
    api
      .put<GroupPost>(`/groups/${groupId}/posts/${postId}`, payload)
      .then((r) => r.data),

  /** DELETE /groups/:id/posts/:postId – admin/moderator only */
  deletePost: (groupId: string, postId: string) =>
    api.delete(`/groups/${groupId}/posts/${postId}`).then((r) => r.data),

  /** PUT /groups/:id/posts/:postId/pin – toggle pin, admin/moderator only */
  togglePin: (groupId: string, postId: string) =>
    api.put(`/groups/${groupId}/posts/${postId}/pin`).then((r) => r.data),
};

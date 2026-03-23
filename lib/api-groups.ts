import { api } from "./api";
import type { Group, GroupMember, GroupPost, MemberRole } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateGroupPayload {
  name: string;
  description?: string;
  privacy?: "public" | "private" | "secret";
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

// ─── Groups API ───────────────────────────────────────────────────────────────

export const groupsApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /groups – public groups ordered by member count */
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<Group[]>("/groups", { params }).then((r) => r.data),

  /** GET /groups/:id */
  get: (groupId: string) =>
    api.get<Group>(`/groups/${groupId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /groups */
  create: (payload: CreateGroupPayload) =>
    api.post<Group>("/groups", payload).then((r) => r.data),

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
};

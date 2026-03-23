import { api } from "./api";
import type { Collection, SavedPost } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateCollectionPayload {
  name: string;
  description?: string;
  icon?: string;
  is_private?: boolean;
}

export interface UpdateCollectionPayload {
  name?: string;
  description?: string;
  icon?: string;
  is_private?: boolean;
}

export interface AddPostToCollectionPayload {
  post_id: string;
  collection_id: string;
}

// ─── Collections API ──────────────────────────────────────────────────────────

export const collectionsApi = {
  // ── My Collections ────────────────────────────────────────────────────────

  /**
   * GET /collections
   * Returns all collections (saved-post folders) belonging to the
   * authenticated user, ordered by creation date descending.
   */
  list: (): Promise<Collection[]> =>
    api.get<Collection[]>("/collections").then((r) => r.data),

  /**
   * GET /collections/:id
   * Returns a single collection by ID.
   * Only the owning user can access private collections.
   */
  get: (collectionId: string): Promise<Collection> =>
    api.get<Collection>(`/collections/${collectionId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * POST /collections
   * Create a new collection (folder for saved posts).
   */
  create: (payload: CreateCollectionPayload): Promise<Collection> =>
    api.post<Collection>("/collections", payload).then((r) => r.data),

  /**
   * PUT /collections/:id
   * Update the name, description, icon, or privacy of a collection.
   */
  update: (
    collectionId: string,
    payload: UpdateCollectionPayload,
  ): Promise<Collection> =>
    api
      .put<Collection>(`/collections/${collectionId}`, payload)
      .then((r) => r.data),

  /**
   * DELETE /collections/:id
   * Delete a collection. The saved posts inside are NOT deleted –
   * they revert to the "unsorted" saved posts list.
   */
  delete: (collectionId: string): Promise<void> =>
    api.delete(`/collections/${collectionId}`).then(() => undefined),

  // ── Posts inside a collection ─────────────────────────────────────────────

  /**
   * GET /collections/:id/posts
   * Returns the saved posts that belong to a specific collection.
   * Each item includes the post_id and the time it was saved.
   */
  getPosts: (collectionId: string): Promise<SavedPost[]> =>
    api
      .get<SavedPost[]>(`/collections/${collectionId}/posts`)
      .then((r) => r.data),

  /**
   * POST /collections/add-post
   * Move a saved post into a collection (or change which collection it
   * belongs to). The post must already be saved by the user.
   *
   * Body: { post_id, collection_id }
   */
  addPost: (payload: AddPostToCollectionPayload): Promise<void> =>
    api.post("/collections/add-post", payload).then(() => undefined),

  /**
   * DELETE /collections/posts/:postId
   * Remove a saved post from any collection it belongs to.
   * The post remains saved (just becomes "unsorted").
   */
  removePost: (postId: string): Promise<void> =>
    api.delete(`/collections/posts/${postId}`).then(() => undefined),
};

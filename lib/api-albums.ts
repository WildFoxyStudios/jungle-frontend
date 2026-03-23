import { api } from "./api";
import type { Album, Photo, UserPhoto } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateAlbumPayload {
  name: string;
  description?: string;
  privacy?: string;
}

export interface UpdateAlbumPayload {
  name?: string;
  description?: string;
  privacy?: string;
  cover_photo_id?: string;
}

export interface AddPhotoPayload {
  url: string;
  caption?: string;
  description?: string;
  location?: string;
  album_id?: string;
}

export interface TagPhotoPayload {
  tagged_user_id: string;
  position_x?: number;
  position_y?: number;
}

export interface AlbumPhotosQuery {
  limit?: number;
  offset?: number;
}

// ─── Albums API ───────────────────────────────────────────────────────────────

export const albumsApi = {
  // ── Albums ──────────────────────────────────────────────────────────────────

  /** POST /albums */
  createAlbum: (payload: CreateAlbumPayload) =>
    api.post<Album>("/albums", payload).then((r) => r.data),

  /** GET /albums/user/:userId */
  getUserAlbums: (userId: string) =>
    api.get<Album[]>(`/albums/user/${userId}`).then((r) => r.data),

  /** GET /albums/:id */
  getAlbum: (albumId: string) =>
    api.get<Album>(`/albums/${albumId}`).then((r) => r.data),

  /** PUT /albums/:id */
  updateAlbum: (albumId: string, payload: UpdateAlbumPayload) =>
    api.put<Album>(`/albums/${albumId}`, payload).then((r) => r.data),

  /** DELETE /albums/:id */
  deleteAlbum: (albumId: string) =>
    api.delete(`/albums/${albumId}`).then((r) => r.data),

  // ── Photos in albums ────────────────────────────────────────────────────────

  /** GET /albums/:id/photos */
  getAlbumPhotos: (albumId: string, params?: AlbumPhotosQuery) =>
    api
      .get<Photo[]>(`/albums/${albumId}/photos`, { params })
      .then((r) => r.data),

  /** POST /albums/:id/photos */
  addPhotoToAlbum: (albumId: string, payload: AddPhotoPayload) =>
    api.post<Photo>(`/albums/${albumId}/photos`, payload).then((r) => r.data),

  // ── Individual photos ────────────────────────────────────────────────────────

  /** DELETE /photos/:id */
  deletePhoto: (photoId: string) =>
    api.delete(`/photos/${photoId}`).then((r) => r.data),

  /** POST /photos/:id/like */
  likePhoto: (photoId: string) =>
    api.post(`/photos/${photoId}/like`).then((r) => r.data),

  /** DELETE /photos/:id/like */
  unlikePhoto: (photoId: string) =>
    api.delete(`/photos/${photoId}/like`).then((r) => r.data),

  /** POST /photos/:id/tag */
  tagUserInPhoto: (photoId: string, payload: TagPhotoPayload) =>
    api.post(`/photos/${photoId}/tag`, payload).then((r) => r.data),

  /** GET /photos/tagged – photos where the current user is tagged */
  getTaggedPhotos: (params?: AlbumPhotosQuery) =>
    api.get<Photo[]>("/photos/tagged", { params }).then((r) => r.data),

  // ── Profile photos ──────────────────────────────────────────────────────────

  /** GET /profile/:userId/photos – all photos from a user's albums */
  getUserProfilePhotos: (userId: string, params?: AlbumPhotosQuery) =>
    api
      .get<Photo[]>(`/profile/${userId}/photos`, { params })
      .then((r) => r.data),
};

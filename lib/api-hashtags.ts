import { api } from "./api";
import type { Hashtag, TrendingHashtag } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface SearchHashtagsQuery {
  q: string;
  limit?: number;
}

export interface HashtagPaginationQuery {
  limit?: number;
  offset?: number;
}

// ─── Hashtags API ─────────────────────────────────────────────────────────────

export const hashtagsApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /hashtags/trending – trending hashtags for today */
  getTrending: (params?: HashtagPaginationQuery) =>
    api
      .get<TrendingHashtag[]>("/hashtags/trending", { params })
      .then((r) => r.data),

  /** GET /hashtags/popular – most-used hashtags overall */
  getPopular: (params?: HashtagPaginationQuery) =>
    api
      .get<Hashtag[]>("/hashtags/popular", { params })
      .then((r) => r.data),

  /** GET /hashtags/search?q=... – search hashtags by name prefix */
  search: (params: SearchHashtagsQuery) =>
    api
      .get<Hashtag[]>("/hashtags/search", { params })
      .then((r) => r.data),

  // ── Single hashtag ────────────────────────────────────────────────────────

  /** GET /hashtags/:name */
  get: (name: string) =>
    api
      .get<Hashtag>(`/hashtags/${encodeURIComponent(name)}`)
      .then((r) => r.data),

  /** GET /hashtags/:name/posts – posts tagged with this hashtag */
  getPosts: (
    name: string,
    params?: HashtagPaginationQuery,
  ) =>
    api
      .get(`/hashtags/${encodeURIComponent(name)}/posts`, { params })
      .then((r) => r.data),

  // ── Following ─────────────────────────────────────────────────────────────

  /** GET /hashtags/followed – hashtags the current user follows */
  getFollowed: () =>
    api.get<Hashtag[]>("/hashtags/followed").then((r) => r.data),

  /** POST /hashtags/:name/follow */
  follow: (name: string) =>
    api
      .post(`/hashtags/${encodeURIComponent(name)}/follow`)
      .then((r) => r.data),

  /** DELETE /hashtags/:name/unfollow */
  unfollow: (name: string) =>
    api
      .delete(`/hashtags/${encodeURIComponent(name)}/unfollow`)
      .then((r) => r.data),
};

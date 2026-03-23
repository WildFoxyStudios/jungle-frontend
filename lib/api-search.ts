import { api } from "./api";
import type { SearchResults, TrendingSearch } from "./types";

// ─── Request payloads / queries ───────────────────────────────────────────────

export interface SearchQuery {
  q: string;
  search_type?:
    | "all"
    | "posts"
    | "people"
    | "groups"
    | "pages"
    | "products"
    | "events";
  limit?: number;
  offset?: number;
}

export interface SearchHistoryItem {
  query: string;
  search_type?: string;
  created_at: string;
}

export interface TrackSearchPayload {
  query: string;
  search_type?: string;
  results_count?: number;
}

export interface UnifiedSearchQuery extends SearchQuery {
  location?: string;
  date_from?: string;
  date_to?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: "relevance" | "date" | "popularity";
}

// ─── Search API ───────────────────────────────────────────────────────────────

export const searchApi = {
  // ── Main search ────────────────────────────────────────────────────────────

  /**
   * GET /search
   * Full-text search across posts, users, groups, pages, products and events.
   * Uses PostgreSQL tsvector / plainto_tsquery under the hood.
   */
  search: (params: SearchQuery) =>
    api.get<SearchResults>("/search", { params }).then((r) => r.data),

  /**
   * GET /search/unified
   * Advanced search endpoint with extra filters (location, price range, dates).
   */
  unified: (params: UnifiedSearchQuery) =>
    api.get<SearchResults>("/search/unified", { params }).then((r) => r.data),

  // ── Trending ───────────────────────────────────────────────────────────────

  /**
   * GET /search/trending
   * Returns the top trending search queries (by daily and weekly counts).
   */
  getTrending: (params?: { limit?: number }) =>
    api
      .get<TrendingSearch[]>("/search/trending", { params })
      .then((r) => r.data),

  // ── History ────────────────────────────────────────────────────────────────

  /**
   * GET /search/history
   * Returns the authenticated user's recent search queries.
   */
  getHistory: (params?: { limit?: number }) =>
    api
      .get<SearchHistoryItem[]>("/search/history", { params })
      .then((r) => r.data),

  /**
   * DELETE /search/history
   * Clears the authenticated user's entire search history.
   */
  clearHistory: () =>
    api
      .delete<{ success: boolean; message: string }>("/search/history")
      .then((r) => r.data),

  // ── Tracking ───────────────────────────────────────────────────────────────

  /**
   * POST /search/track
   * Records a search event for analytics and personalisation.
   * Should be called after every search the user submits.
   */
  track: (payload: TrackSearchPayload) =>
    api.post("/search/track", payload).then((r) => r.data),
};

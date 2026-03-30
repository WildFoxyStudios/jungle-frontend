import { api } from "./api";
import type {
  SearchResults,
  TrendingSearch,
  AutocompleteResults,
  SearchHistoryEntry,
} from "./types";

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
  date_from?: string;
  date_to?: string;
  sort_by?: "relevance" | "date" | "popularity";
  min_price?: number;
  max_price?: number;
}

export interface TrackSearchPayload {
  query: string;
  search_type?: string;
  results_count?: number;
}

// ─── Search API ───────────────────────────────────────────────────────────────

export const searchApi = {
  // ── Main search ────────────────────────────────────────────────────────────

  search: (params: SearchQuery) =>
    api.get<SearchResults>("/search", { params }).then((r) => r.data),

  // ── Autocomplete ───────────────────────────────────────────────────────────

  autocomplete: (params: { q: string; limit?: number }) =>
    api
      .get<AutocompleteResults>("/search/autocomplete", { params })
      .then((r) => r.data),

  // ── Trending ───────────────────────────────────────────────────────────────

  getTrending: (params?: { limit?: number }) =>
    api
      .get<TrendingSearch[]>("/search/trending", { params })
      .then((r) => r.data),

  // ── History ────────────────────────────────────────────────────────────────

  getHistory: (params?: { limit?: number }) =>
    api
      .get<SearchHistoryEntry[]>("/search/history", { params })
      .then((r) => r.data),

  deleteHistoryItem: (id: string) =>
    api.delete(`/search/history/${id}`).then((r) => r.data),

  clearHistory: () =>
    api
      .delete<{ success: boolean; message: string }>("/search/history")
      .then((r) => r.data),

  // ── Tracking ───────────────────────────────────────────────────────────────

  track: (payload: TrackSearchPayload) =>
    api.post("/search/track", payload).then((r) => r.data),
};

import { api } from "./api";
import type { GifResult } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface SearchGifsQuery {
  q: string;
  limit?: number;
  provider?: "giphy" | "tenor" | "auto";
}

export interface TrendingGifsQuery {
  limit?: number;
}

export interface GifSearchHistoryItem {
  search_term: string;
  searched_at: string;
}

// ─── GIFs API ─────────────────────────────────────────────────────────────────

export const gifsApi = {
  /**
   * GET /gif/search?q=...
   * Search for GIFs using Giphy, Tenor, or both (provider=auto).
   * Results are cached by the backend to avoid repeated external API calls.
   * The search query is also saved to the user's GIF search history.
   *
   * @param params.q        - The search query (e.g. "funny cat")
   * @param params.limit    - Max number of results (default 20, max 50)
   * @param params.provider - Which provider to use: "giphy" | "tenor" | "auto"
   */
  search: (params: SearchGifsQuery): Promise<GifResult[]> =>
    api
      .get<GifResult[]>("/gif/search", { params })
      .then((r) => r.data),

  /**
   * GET /gif/trending
   * Returns currently trending GIFs from the configured provider(s).
   * Results are cached and refreshed periodically by the backend.
   *
   * @param params.limit - Max number of results (default 20, max 50)
   */
  getTrending: (params?: TrendingGifsQuery): Promise<GifResult[]> =>
    api
      .get<GifResult[]>("/gif/trending", { params })
      .then((r) => r.data),

  /**
   * GET /gif/history
   * Returns the authenticated user's recent GIF search history.
   * Deduplicates by search term, ordered by most recently searched.
   * Returns the last 10 distinct search terms.
   */
  getHistory: (): Promise<GifSearchHistoryItem[]> =>
    api
      .get<GifSearchHistoryItem[]>("/gif/history")
      .then((r) => r.data),
};

import { api } from "./api";
import type { PageAnalytics, PostAnalytics, AnalyticsSummary } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface PageAnalyticsQuery {
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
}

export interface RecordAnalyticsEventPayload {
  event_type: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

export interface AudienceInsights {
  top_cities: Array<{ city: string; count: number }>;
  top_countries: Array<{ country: string; count: number }>;
  peak_hours: Array<{ hour: number; count: number }>;
  day_of_week_activity: Array<{ day: number; count: number }>;
}

export interface HourlyMetric {
  hour: string;
  views: number;
  unique_viewers: number;
  reactions: number;
  comments: number;
  shares: number;
}

// ─── Analytics API ────────────────────────────────────────────────────────────

export const analyticsApi = {
  // ── Page Analytics ────────────────────────────────────────────────────────

  /**
   * GET /pages/:pageId/analytics
   * Returns day-by-day analytics for a page over a date range.
   * Requires the caller to be an admin of the page.
   *
   * Defaults to the last 30 days when no range is specified.
   */
  getPageAnalytics: (
    pageId: string,
    params?: PageAnalyticsQuery,
  ): Promise<PageAnalytics[]> =>
    api
      .get<PageAnalytics[]>(`/pages/${pageId}/analytics`, { params })
      .then((r) => r.data),

  /**
   * GET /pages/:pageId/analytics/summary
   * Returns a high-level summary for a page dashboard:
   * total reach, total engagement, follower count, growth rate,
   * top-performing post, and a 7-day activity chart.
   *
   * Requires the caller to be an admin of the page.
   */
  getPageSummary: (pageId: string): Promise<AnalyticsSummary> =>
    api
      .get<AnalyticsSummary>(`/pages/${pageId}/analytics/summary`)
      .then((r) => r.data),

  /**
   * GET /pages/:pageId/insights
   * Returns audience demographic insights (top cities/countries,
   * peak activity hours, day-of-week breakdown).
   *
   * Requires the caller to be an admin of the page.
   */
  getAudienceInsights: (
    pageId: string,
    params?: Pick<PageAnalyticsQuery, "end_date">,
  ): Promise<AudienceInsights> =>
    api
      .get<AudienceInsights>(`/pages/${pageId}/insights`, { params })
      .then((r) => r.data),

  // ── Post Analytics ────────────────────────────────────────────────────────

  /**
   * GET /posts/:postId/analytics
   * Returns reach, impressions, engaged users, clicks, and video metrics
   * for a single post.
   *
   * Only the post author can access this endpoint.
   */
  getPostAnalytics: (postId: string): Promise<PostAnalytics> =>
    api
      .get<PostAnalytics>(`/posts/${postId}/analytics`)
      .then((r) => r.data),

  // ── Hourly Metrics ────────────────────────────────────────────────────────

  /**
   * GET /:entityType/:entityId/metrics/hourly
   * Returns hour-by-hour metrics for any entity (post, reel, video, stream)
   * over the last 24 hours.
   *
   * @param entityType - e.g. "post", "reel", "watch_video", "stream"
   * @param entityId   - UUID of the entity
   */
  getHourlyMetrics: (
    entityType: string,
    entityId: string,
  ): Promise<HourlyMetric[]> =>
    api
      .get<HourlyMetric[]>(`/${entityType}/${entityId}/metrics/hourly`)
      .then((r) => r.data),

  // ── Event Tracking ────────────────────────────────────────────────────────

  /**
   * POST /analytics/events
   * Records a custom analytics event (e.g. "video_play_50_percent",
   * "link_click", "story_swipe_up") for later aggregation.
   *
   * Fire-and-forget in most cases – errors are silently ignored by callers.
   */
  recordEvent: (
    payload: RecordAnalyticsEventPayload,
  ): Promise<{ success: boolean }> =>
    api
      .post<{ success: boolean }>("/analytics/events", payload)
      .then((r) => r.data),
};

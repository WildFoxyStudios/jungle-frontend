import { api } from "./api";
import type { Page, PagePost, PageCategory } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreatePagePayload {
  name: string;
  username?: string;
  category: PageCategory;
  description?: string;
}

export interface UpdatePagePayload {
  name?: string;
  description?: string;
  about?: string;
  picture_url?: string;
  cover_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface CreatePagePostPayload {
  content?: string;
  media_urls?: string[];
  link_url?: string;
  scheduled_at?: string;
}

export interface ReviewPagePayload {
  rating: number;
  comment?: string;
}

export interface AddPageAdminPayload {
  user_id: string;
  role?: "admin" | "editor" | "moderator" | "analyst" | "advertiser";
}

export interface PageAdminResponse {
  id: string;
  page_id: string;
  user_id: string;
  role: string;
  added_at: string;
}

export interface PageReview {
  id: string;
  page_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PageInsights {
  total_followers: number;
  new_followers_7d: number;
  new_followers_30d: number;
  total_posts: number;
  engagement_rate: number;
}

export interface PaginatedPagesResponse {
  data: Page[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface PagesQuery {
  limit?: number;
  cursor?: string;
}

// ─── Pages API ────────────────────────────────────────────────────────────────

export const pagesApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /pages – public pages ordered by followers */
  list: (params?: PagesQuery) =>
    api.get<Page[]>("/pages", { params }).then((r) => r.data),

  /** GET /pages – cursor-paginated public pages */
  listPaginated: (params?: PagesQuery) =>
    api.get<PaginatedPagesResponse>("/pages", { params }).then((r) => r.data),

  /** GET /pages/mine – pages the authenticated user manages */
  getMine: () => api.get<Page[]>("/pages/mine").then((r) => r.data),

  /** GET /pages/:id */
  get: (pageId: string) =>
    api.get<Page>(`/pages/${pageId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /pages */
  create: (payload: CreatePagePayload) =>
    api.post<Page>("/pages", payload).then((r) => r.data),

  /** PUT /pages/:id */
  update: (pageId: string, payload: UpdatePagePayload) =>
    api.put<Page>(`/pages/${pageId}`, payload).then((r) => r.data),

  /** DELETE /pages/:id – only the page owner can delete */
  delete: (pageId: string) =>
    api.delete(`/pages/${pageId}`).then((r) => r.data),

  // ── Follow ────────────────────────────────────────────────────────────────

  /** POST /pages/:id/follow */
  follow: (pageId: string) =>
    api.post(`/pages/${pageId}/follow`).then((r) => r.data),

  /** DELETE /pages/:id/follow */
  unfollow: (pageId: string) =>
    api.delete(`/pages/${pageId}/follow`).then((r) => r.data),

  // ── Posts ─────────────────────────────────────────────────────────────────

  /** GET /pages/:id/posts – published posts from a page (cursor-paginated) */
  getPosts: (pageId: string, params?: PagesQuery) =>
    api
      .get<PagePost[]>(`/pages/${pageId}/posts`, { params })
      .then((r) => r.data),

  /** POST /pages/:id/posts – create / schedule a post as the page */
  createPost: (pageId: string, payload: CreatePagePostPayload) =>
    api.post<PagePost>(`/pages/${pageId}/posts`, payload).then((r) => r.data),

  // ── Reviews ───────────────────────────────────────────────────────────────

  /** POST /pages/:id/review – leave or update a star rating + comment */
  review: (pageId: string, payload: ReviewPagePayload) =>
    api
      .post<PageReview>(`/pages/${pageId}/review`, payload)
      .then((r) => r.data),

  // ── Insights ──────────────────────────────────────────────────────────────

  /** GET /pages/:id/insights – real metrics for page admins */
  getInsights: (pageId: string) =>
    api.get<PageInsights>(`/pages/${pageId}/insights`).then((r) => r.data),

  // ── Admins ────────────────────────────────────────────────────────────────

  /** POST /pages/:id/admins – add or update a page admin (owner/admin only) */
  addAdmin: (pageId: string, payload: AddPageAdminPayload) =>
    api
      .post<PageAdminResponse>(`/pages/${pageId}/admins`, payload)
      .then((r) => r.data),
};

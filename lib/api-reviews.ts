import { api } from "./api";
import type { ProductReview, ReviewSummary } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  review_text?: string;
  images?: string[];
}

export interface VoteReviewPayload {
  is_helpful: boolean;
}

export interface VoteReviewResult {
  success: boolean;
  helpful_count: number;
  not_helpful_count: number;
}

export interface ReviewsQuery {
  rating?: number;
  verified_only?: boolean;
  sort?: "recent" | "helpful" | "rating_high" | "rating_low";
  limit?: number;
  offset?: number;
}

// ─── Reviews API ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  /**
   * GET /products/:productId/reviews
   * Returns paginated reviews for a marketplace product.
   * Can be filtered by star rating, verified purchases, and sorted multiple ways.
   */
  getProductReviews: (
    productId: string,
    params?: ReviewsQuery,
  ): Promise<ProductReview[]> =>
    api
      .get<ProductReview[]>(`/products/${productId}/reviews`, { params })
      .then((r) => r.data),

  /**
   * GET /products/:productId/reviews/summary
   * Returns aggregate review statistics for a product:
   * average rating, total count, and a distribution breakdown (1-5 stars).
   */
  getReviewSummary: (productId: string): Promise<ReviewSummary> =>
    api
      .get<ReviewSummary>(`/products/${productId}/reviews/summary`)
      .then((r) => r.data),

  /**
   * POST /products/:productId/reviews
   * Submit a new review for a product.
   * - A user can only submit one review per product.
   * - If the user purchased the product, `verified_purchase` is set automatically.
   * - Rating must be between 1 and 5.
   */
  createReview: (
    productId: string,
    payload: CreateReviewPayload,
  ): Promise<ProductReview> =>
    api
      .post<ProductReview>(`/products/${productId}/reviews`, payload)
      .then((r) => r.data),

  /**
   * POST /reviews/:reviewId/vote
   * Mark a review as helpful or not helpful.
   * A user can change their vote by calling this endpoint again with
   * a different `is_helpful` value.
   */
  voteReview: (
    reviewId: string,
    payload: VoteReviewPayload,
  ): Promise<VoteReviewResult> =>
    api
      .post<VoteReviewResult>(`/reviews/${reviewId}/vote`, payload)
      .then((r) => r.data),
};

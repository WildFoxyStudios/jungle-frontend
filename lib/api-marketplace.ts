import { api } from "./api";
import type {
  MarketplaceProduct,
  MarketplaceOffer,
  MarketplaceCategory,
  ProductCondition,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateProductPayload {
  category_id?: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  condition: ProductCondition;
  location?: string;
  images?: string[];
  stock?: number;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface MakeOfferPayload {
  offered_price: number;
  message?: string;
}

export interface ProductsQuery {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  limit?: number;
  offset?: number;
  q?: string;
}

// ─── Marketplace API ──────────────────────────────────────────────────────────

export const marketplaceApi = {
  // ── Categories ──────────────────────────────────────────────────────────────

  /** GET /marketplace/categories */
  getCategories: () =>
    api
      .get<MarketplaceCategory[]>("/marketplace/categories")
      .then((r) => r.data),

  // ── Products ────────────────────────────────────────────────────────────────

  /** GET /marketplace/products */
  getProducts: (params?: ProductsQuery) =>
    api
      .get<MarketplaceProduct[]>("/marketplace/products", { params })
      .then((r) => r.data),

  /** GET /marketplace/products/:id */
  getProduct: (productId: string) =>
    api
      .get<MarketplaceProduct>(`/marketplace/products/${productId}`)
      .then((r) => r.data),

  /** GET /marketplace/products/my */
  getMyProducts: (params?: { limit?: number; offset?: number }) =>
    api
      .get<MarketplaceProduct[]>("/marketplace/products/my", { params })
      .then((r) => r.data),

  /** POST /marketplace/products */
  createProduct: (payload: CreateProductPayload) =>
    api
      .post<MarketplaceProduct>("/marketplace/products", payload)
      .then((r) => r.data),

  /** PUT /marketplace/products/:id */
  updateProduct: (productId: string, payload: UpdateProductPayload) =>
    api
      .put<MarketplaceProduct>(`/marketplace/products/${productId}`, payload)
      .then((r) => r.data),

  /** DELETE /marketplace/products/:id */
  deleteProduct: (productId: string) =>
    api.delete(`/marketplace/products/${productId}`).then((r) => r.data),

  /** POST /marketplace/:id/mark-sold */
  markAsSold: (productId: string) =>
    api.post(`/marketplace/${productId}/mark-sold`).then((r) => r.data),

  /** POST /marketplace/products/:id/save */
  saveProduct: (productId: string) =>
    api.post(`/marketplace/products/${productId}/save`).then((r) => r.data),

  // ── Offers ──────────────────────────────────────────────────────────────────

  /** POST /marketplace/products/:id/offer */
  makeOffer: (productId: string, payload: MakeOfferPayload) =>
    api
      .post<MarketplaceOffer>(
        `/marketplace/products/${productId}/offer`,
        payload,
      )
      .then((r) => r.data),

  /** GET /marketplace/products/:id/offers */
  getProductOffers: (productId: string) =>
    api
      .get<MarketplaceOffer[]>(`/marketplace/products/${productId}/offers`)
      .then((r) => r.data),

  /** POST /marketplace/offers/:id/accept */
  acceptOffer: (offerId: string) =>
    api.post(`/marketplace/offers/${offerId}/accept`).then((r) => r.data),

  /** POST /marketplace/offers/:id/reject */
  rejectOffer: (offerId: string) =>
    api.post(`/marketplace/offers/${offerId}/reject`).then((r) => r.data),

  /** GET /marketplace/my-offers */
  getMyOffers: () =>
    api.get<MarketplaceOffer[]>("/marketplace/my-offers").then((r) => r.data),
};

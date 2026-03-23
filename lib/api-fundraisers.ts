import { api } from "./api";
import type {
  Fundraiser,
  Donation,
  FundraiserUpdate,
  FundraiserCategory,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateFundraiserPayload {
  title: string;
  description?: string;
  story?: string;
  category_id?: string;
  goal_amount: number;
  currency?: string;
  beneficiary_type?: string;
}

export interface DonatePayload {
  amount: number;
  is_anonymous?: boolean;
  message?: string;
  payment_method?: string;
}

export interface CreateFundraiserUpdatePayload {
  content: string;
  media_urls?: string[];
}

export interface FundraisersQuery {
  category_id?: string;
  limit?: number;
  offset?: number;
}

// ─── Fundraisers API ──────────────────────────────────────────────────────────

export const fundraisersApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /fundraisers – active fundraisers, optionally filtered by category */
  list: (params?: FundraisersQuery) =>
    api.get<Fundraiser[]>("/fundraisers", { params }).then((r) => r.data),

  /** GET /fundraisers/categories */
  getCategories: () =>
    api
      .get<FundraiserCategory[]>("/fundraisers/categories")
      .then((r) => r.data),

  /** GET /fundraisers/my – fundraisers created by the current user */
  getMy: () =>
    api.get<Fundraiser[]>("/fundraisers/my").then((r) => r.data),

  /** GET /fundraisers/:id */
  get: (fundraiserId: string) =>
    api.get<Fundraiser>(`/fundraisers/${fundraiserId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /fundraisers */
  create: (payload: CreateFundraiserPayload) =>
    api.post<Fundraiser>("/fundraisers", payload).then((r) => r.data),

  /** DELETE /fundraisers/:id – soft-delete (sets status to cancelled) */
  delete: (fundraiserId: string) =>
    api.delete(`/fundraisers/${fundraiserId}`).then((r) => r.data),

  // ── Donations ─────────────────────────────────────────────────────────────

  /** POST /fundraisers/:id/donate */
  donate: (fundraiserId: string, payload: DonatePayload) =>
    api
      .post<Donation>(`/fundraisers/${fundraiserId}/donate`, payload)
      .then((r) => r.data),

  /** GET /fundraisers/:id/donations */
  getDonations: (fundraiserId: string) =>
    api
      .get<Donation[]>(`/fundraisers/${fundraiserId}/donations`)
      .then((r) => r.data),

  // ── Save ──────────────────────────────────────────────────────────────────

  /** POST /fundraisers/:id/save */
  save: (fundraiserId: string) =>
    api.post(`/fundraisers/${fundraiserId}/save`).then((r) => r.data),

  /** DELETE /fundraisers/:id/save */
  unsave: (fundraiserId: string) =>
    api.delete(`/fundraisers/${fundraiserId}/save`).then((r) => r.data),

  // ── Updates ───────────────────────────────────────────────────────────────

  /** GET /fundraisers/:id/updates */
  getUpdates: (fundraiserId: string) =>
    api
      .get<FundraiserUpdate[]>(`/fundraisers/${fundraiserId}/updates`)
      .then((r) => r.data),

  /** POST /fundraisers/:id/updates */
  createUpdate: (
    fundraiserId: string,
    payload: CreateFundraiserUpdatePayload,
  ) =>
    api
      .post<FundraiserUpdate>(`/fundraisers/${fundraiserId}/updates`, payload)
      .then((r) => r.data),
};

import axios from "axios";
import { api, API_BASE_URL } from "./api";

// Admin pages use paths like "/api/admin/stats" explicitly,
// so the adminApi base must NOT include the /api suffix.
const ADMIN_BASE = API_BASE_URL.replace(/\/api$/, "");

export const adminApi = axios.create({
  baseURL: ADMIN_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Forward the auth token from the main api instance
adminApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Admin API (named functions) ──────────────────────────────────────────────

export const adminFunctions = {
  // System
  getHealth: () => api.get("/api/health").then((r) => r.data),
  getSystemStats: () => api.get("/api/admin/stats").then((r) => r.data),

  // Users
  listUsers: (params?: { search?: string; page?: number; per_page?: number }) =>
    api.get("/api/admin/users", { params }).then((r) => r.data),
  getUser: (userId: string) =>
    api.get(`/api/admin/users/${userId}`).then((r) => r.data),
  banUser: (userId: string) =>
    api.put(`/api/admin/users/${userId}/ban`).then((r) => r.data),
  unbanUser: (userId: string) =>
    api.put(`/api/admin/users/${userId}/unban`).then((r) => r.data),
  verifyUser: (userId: string) =>
    api.put(`/api/admin/users/${userId}/verify`).then((r) => r.data),

  // Moderation
  getModeration: (params?: { status?: string; page?: number }) =>
    api.get("/api/moderation", { params }).then((r) => r.data),
  reviewContent: (contentId: string, data: { action: string; reason?: string }) =>
    api.post(`/api/moderation/${contentId}/review`, data).then((r) => r.data),
  getModerationStats: () => api.get("/api/moderation/stats").then((r) => r.data),

  // Reports
  getReports: () => api.get("/api/admin/reports").then((r) => r.data),
  resolveReport: (reportId: string, data: { action: string; notes?: string }) =>
    api.put(`/api/admin/reports/${reportId}/resolve`, data).then((r) => r.data),

  // Posts
  deletePost: (postId: string) =>
    api.delete(`/api/admin/posts/${postId}`).then((r) => r.data),

  // Finances
  getFinances: () => api.get("/api/admin/finances").then((r) => r.data),
  getWithdrawals: () => api.get("/api/admin/withdrawals").then((r) => r.data),
  processWithdrawal: (withdrawalId: string, data: { action: string }) =>
    api.put(`/api/admin/withdrawals/${withdrawalId}/process`, data).then((r) => r.data),

  // Maintenance
  processScheduledPosts: () => api.post("/api/admin/process-scheduled").then((r) => r.data),
  cleanupGifCache: () => api.post("/api/admin/cleanup-gifs").then((r) => r.data),
  cleanupSessions: () => api.post("/api/admin/cleanup-sessions").then((r) => r.data),
};

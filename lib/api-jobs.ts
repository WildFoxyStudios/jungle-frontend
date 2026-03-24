import { api } from "./api";
import type {
  JobPosting,
  JobApplication,
  JobApplicant,
  JobCategory,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateJobPayload {
  title: string;
  description: string;
  category_id?: string;
  location?: string;
  city?: string;
  country?: string;
  is_remote?: boolean;
  employment_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  show_salary?: boolean;
  page_id?: string;
}

export type UpdateJobPayload = Partial<CreateJobPayload>;

export interface ApplyJobPayload {
  cover_letter?: string;
  resume_url?: string;
}

export interface UpdateApplicationStatusPayload {
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  notes?: string;
}

export interface JobSearchQuery {
  keywords?: string;
  category_id?: string;
  location?: string;
  employment_type?: string;
  is_remote?: boolean;
  limit?: number;
  offset?: number;
}

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export const jobsApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /jobs/search – search active job postings */
  search: (params?: JobSearchQuery) =>
    api.get<JobPosting[]>("/jobs/search", { params }).then((r) => r.data),

  /** GET /jobs/categories – list all job categories */
  getCategories: () =>
    api.get<JobCategory[]>("/jobs/categories").then((r) => r.data),

  /** GET /jobs/recommended – jobs matching the current user's profile */
  getRecommended: () =>
    api.get<JobPosting[]>("/jobs/recommended").then((r) => r.data),

  /** GET /jobs/:id – single job posting detail */
  get: (jobId: string) =>
    api.get<JobPosting>(`/jobs/${jobId}`).then((r) => r.data),

  // ── My jobs (poster) ──────────────────────────────────────────────────────

  /** GET /jobs/my – job postings created by the current user */
  getMy: () => api.get<JobPosting[]>("/jobs/my").then((r) => r.data),

  /** POST /jobs – create a new job posting */
  create: (payload: CreateJobPayload) =>
    api.post<JobPosting>("/jobs", payload).then((r) => r.data),

  /** DELETE /jobs/:id – soft-delete / close a job posting */
  delete: (jobId: string) =>
    api.delete(`/jobs/${jobId}`).then((r) => r.data),

  /** POST /jobs/:id/close – mark a job as closed without deleting */
  close: (jobId: string) =>
    api.post(`/jobs/${jobId}/close`).then((r) => r.data),

  /** GET /jobs/:id/applicants – list applicants for a job (poster only) */
  getApplicants: (jobId: string) =>
    api.get<JobApplicant[]>(`/jobs/${jobId}/applicants`).then((r) => r.data),

  // ── Applications (job-seeker) ─────────────────────────────────────────────

  /** GET /jobs/applications – applications submitted by the current user */
  getMyApplications: () =>
    api.get<JobApplication[]>("/jobs/applications").then((r) => r.data),

  /** POST /jobs/:id/apply – apply to a job posting */
  apply: (jobId: string, payload: ApplyJobPayload) =>
    api.post(`/jobs/${jobId}/apply`, payload).then((r) => r.data),

  /** PUT /jobs/applications/:id/status – update status of an application (poster only) */
  updateApplicationStatus: (
    applicationId: string,
    payload: UpdateApplicationStatusPayload,
  ) =>
    api
      .put(`/jobs/applications/${applicationId}/status`, payload)
      .then((r) => r.data),

  // ── Saved jobs ────────────────────────────────────────────────────────────

  /** GET /jobs/saved – jobs the current user has saved */
  getSaved: () => api.get<JobPosting[]>("/jobs/saved").then((r) => r.data),

  /** POST /jobs/:id/save */
  save: (jobId: string) =>
    api.post(`/jobs/${jobId}/save`).then((r) => r.data),

  /** DELETE /jobs/:id/save */
  unsave: (jobId: string) =>
    api.delete(`/jobs/${jobId}/save`).then((r) => r.data),
};

import { api } from "./api";
import type {
  CompleteProfile,
  UserProfile,
  UserPhoto,
  Education,
  Work,
  PlaceLived,
  Interest,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  full_name?: string;
  bio?: string;
  website?: string;
  birth_date?: string;
  gender?: string;
  relationship_status?: string;
  location_city?: string;
  location_country?: string;
  phone_number?: string;
  languages?: string[];
  work_current?: string;
  work_position?: string;
  education_current?: string;
}

export interface AddPhotoPayload {
  url: string;
  caption?: string;
  album_type?: string;
  album_name?: string;
}

export interface AddEducationPayload {
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
  is_current?: boolean;
  description?: string;
}

export interface AddWorkPayload {
  company_name: string;
  position: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
}

export interface AddPlacePayload {
  city: string;
  country: string;
  place_type?: string;
  start_year?: number;
  end_year?: number;
}

export interface AddInterestPayload {
  category: string;
  interest_name: string;
}

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  // ── Full profile ──────────────────────────────────────────────────────────

  /**
   * GET /profile/:userId
   * Returns the complete profile for a user: basic info, stats, photos,
   * education, work history, places lived, and interests.
   */
  getProfile: (userId: string): Promise<CompleteProfile> =>
    api.get<CompleteProfile>(`/profile/${userId}`).then((r) => r.data),

  // ── Update basic info ─────────────────────────────────────────────────────

  /**
   * PUT /profile
   * Partial update of the authenticated user's profile fields.
   * Only the fields included in the payload are changed.
   */
  updateProfile: (payload: UpdateProfilePayload): Promise<UserProfile> =>
    api.put<UserProfile>("/profile", payload).then((r) => r.data),

  // ── Profile & cover pictures ──────────────────────────────────────────────

  /**
   * POST /profile/picture
   * Update the authenticated user's profile picture URL.
   * The URL should have already been obtained from the /upload/profile endpoint.
   */
  updateProfilePicture: (url: string): Promise<void> =>
    api.post("/profile/picture", { url }).then(() => undefined),

  /**
   * POST /profile/cover
   * Update the authenticated user's cover / banner photo URL.
   */
  updateCoverPhoto: (url: string): Promise<void> =>
    api.post("/profile/cover", { url }).then(() => undefined),

  // ── Photos ────────────────────────────────────────────────────────────────

  /**
   * POST /profile/photos
   * Add a photo to the authenticated user's profile timeline.
   */
  addPhoto: (payload: AddPhotoPayload): Promise<UserPhoto> =>
    api.post<UserPhoto>("/profile/photos", payload).then((r) => r.data),

  /**
   * GET /profile/:userId/photos
   * Returns all non-deleted photos belonging to a user across all their albums.
   * Uses the correct backend route (GET /profile/:userId/photos).
   */
  getUserPhotos: (
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<UserPhoto[]> =>
    api
      .get<UserPhoto[]>(`/profile/${userId}/photos`, { params })
      .then((r) => r.data),

  /**
   * DELETE /profile/photos/:id
   * Soft-deletes a photo (sets deleted_at). Only the owning user can do this.
   */
  deletePhoto: (photoId: string): Promise<void> =>
    api.delete(`/profile/photos/${photoId}`).then(() => undefined),

  // ── Education ─────────────────────────────────────────────────────────────

  /**
   * POST /profile/education
   * Add an education entry (school, degree, years, etc.).
   */
  addEducation: (payload: AddEducationPayload): Promise<Education> =>
    api.post<Education>("/profile/education", payload).then((r) => r.data),

  /**
   * DELETE /profile/education/:id
   * Remove an education entry by its ID.
   */
  deleteEducation: (educationId: string): Promise<void> =>
    api.delete(`/profile/education/${educationId}`).then(() => undefined),

  // ── Work ──────────────────────────────────────────────────────────────────

  /**
   * POST /profile/work
   * Add a work experience entry.
   */
  addWork: (payload: AddWorkPayload): Promise<Work> =>
    api.post<Work>("/profile/work", payload).then((r) => r.data),

  /**
   * DELETE /profile/work/:id
   * Remove a work experience entry.
   */
  deleteWork: (workId: string): Promise<void> =>
    api.delete(`/profile/work/${workId}`).then(() => undefined),

  // ── Places lived ──────────────────────────────────────────────────────────

  /**
   * POST /profile/places
   * Add a "place lived" entry (hometown, current city, etc.).
   */
  addPlace: (payload: AddPlacePayload): Promise<PlaceLived> =>
    api.post<PlaceLived>("/profile/places", payload).then((r) => r.data),

  /**
   * DELETE /profile/places/:id
   * Remove a place-lived entry.
   */
  deletePlace: (placeId: string): Promise<void> =>
    api.delete(`/profile/places/${placeId}`).then(() => undefined),

  // ── Interests ─────────────────────────────────────────────────────────────

  /**
   * POST /profile/interests
   * Add an interest (music, sports, books, etc.).
   */
  addInterest: (payload: AddInterestPayload): Promise<Interest> =>
    api.post<Interest>("/profile/interests", payload).then((r) => r.data),

  /**
   * DELETE /profile/interests/:id
   * Remove an interest entry.
   */
  deleteInterest: (interestId: string): Promise<void> =>
    api.delete(`/profile/interests/${interestId}`).then(() => undefined),
};

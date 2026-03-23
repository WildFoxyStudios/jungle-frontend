import { api } from "./api";
import type { UserSettings, LoginSession } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface UpdateSettingsPayload {
  profile_visibility?: string;
  search_visibility?: string;
  online_status_visible?: boolean;
  show_active_status?: boolean;
  who_can_send_requests?: string;
  who_can_message?: string;
  who_can_see_friends?: string;
  who_can_see_posts?: string;
  who_can_comment?: string;
  who_can_tag?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  theme?: string;
  language?: string;
  timezone?: string;
}

// ─── Settings API ─────────────────────────────────────────────────────────────

export const settingsApi = {
  // ── User Settings ──────────────────────────────────────────────────────────

  /**
   * GET /settings
   * Returns the full settings object for the authenticated user.
   * If no settings row exists yet, the backend creates one with defaults.
   */
  get: () => api.get<UserSettings>("/settings").then((r) => r.data),

  /**
   * PUT /settings
   * Partial update – only the fields included in the payload are changed.
   * Uses COALESCE on the backend so omitted fields keep their current value.
   */
  update: (payload: UpdateSettingsPayload) =>
    api.put<UserSettings>("/settings", payload).then((r) => r.data),

  // ── Login Sessions ─────────────────────────────────────────────────────────

  /**
   * GET /settings/sessions
   * Returns active login sessions for the current user (device, IP, last active).
   */
  getSessions: () =>
    api.get<LoginSession[]>("/settings/sessions").then((r) => r.data),
};

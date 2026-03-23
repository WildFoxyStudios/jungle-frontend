import { api } from "./api";
import type {
  TwoFactorSetup,
  BackupCodes,
  LoginSession,
  UserSettings,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface Enable2FAPayload {
  code: string;
}

export interface Verify2FAPayload {
  code: string;
}

export interface Disable2FAPayload {
  code: string;
  password: string;
}

export interface SendPhoneCodePayload {
  phone_number: string;
}

export interface VerifyPhonePayload {
  phone_number: string;
  code: string;
}

export interface UpdatePrivacyPayload {
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
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ─── Security API ─────────────────────────────────────────────────────────────

export const securityApi = {
  // ── Two-Factor Authentication ─────────────────────────────────────────────

  /**
   * POST /security/2fa/setup
   * Returns a QR code URL + TOTP secret the user scans with their authenticator app.
   */
  setup2FA: () =>
    api.post<TwoFactorSetup>("/security/2fa/setup").then((r) => r.data),

  /**
   * POST /security/2fa/enable
   * Confirms setup by verifying the first TOTP code.
   * Returns backup codes for account recovery.
   */
  enable2FA: (payload: Enable2FAPayload) =>
    api
      .post<BackupCodes>("/security/2fa/enable", payload)
      .then((r) => r.data),

  /**
   * POST /security/2fa/disable
   * Disables 2FA after verifying identity.
   */
  disable2FA: (payload: Disable2FAPayload) =>
    api.post("/security/2fa/disable", payload).then((r) => r.data),

  /**
   * POST /security/2fa/verify
   * Verifies a TOTP code (used for sensitive actions while already logged in).
   */
  verify2FA: (payload: Verify2FAPayload) =>
    api
      .post<{ valid: boolean }>("/security/2fa/verify", payload)
      .then((r) => r.data),

  /**
   * POST /security/2fa/backup-codes
   * Regenerates backup codes. Existing codes are invalidated.
   */
  regenerateBackupCodes: () =>
    api
      .post<BackupCodes>("/security/2fa/backup-codes")
      .then((r) => r.data),

  // ── Phone Verification ────────────────────────────────────────────────────

  /** POST /security/phone/send-code */
  sendPhoneCode: (payload: SendPhoneCodePayload) =>
    api.post("/security/phone/send-code", payload).then((r) => r.data),

  /** POST /security/phone/verify */
  verifyPhone: (payload: VerifyPhonePayload) =>
    api.post("/security/phone/verify", payload).then((r) => r.data),

  // ── Sessions ──────────────────────────────────────────────────────────────

  /** GET /security/sessions – active login sessions across all devices */
  getSessions: () =>
    api.get<LoginSession[]>("/security/sessions").then((r) => r.data),

  /** POST /security/sessions/:id/revoke – revoke a single session by ID */
  revokeSession: (sessionId: string) =>
    api.post(`/security/sessions/${sessionId}/revoke`).then((r) => r.data),

  /** POST /security/sessions/revoke-all – sign out all other devices */
  revokeAllSessions: () =>
    api.post("/security/sessions/revoke-all").then((r) => r.data),

  // ── Privacy Settings ──────────────────────────────────────────────────────

  /**
   * PUT /security/privacy
   * Updates who can see the user's profile, posts, friends, etc.
   */
  updatePrivacy: (payload: UpdatePrivacyPayload) =>
    api
      .put<UserSettings>("/security/privacy", payload)
      .then((r) => r.data),

  // ── GDPR ──────────────────────────────────────────────────────────────────

  /**
   * POST /security/data-export
   * Queues a full data export. The user receives an email when it's ready.
   */
  requestDataExport: () =>
    api
      .post<{ message: string }>("/security/data-export")
      .then((r) => r.data),

  /**
   * POST /security/data-deletion
   * Initiates an account deletion request (30-day grace period).
   */
  requestDataDeletion: () =>
    api
      .post<{ message: string }>("/security/data-deletion")
      .then((r) => r.data),

  // ── Audit Log ─────────────────────────────────────────────────────────────

  /**
   * GET /security/audit-log
   * Returns recent security-related events for the authenticated user
   * (logins, password changes, 2FA changes, etc.).
   */
  getAuditLog: (params?: { limit?: number; offset?: number }) =>
    api
      .get<AuditLogEntry[]>("/security/audit-log", { params })
      .then((r) => r.data),
};

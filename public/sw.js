/**
 * sw.js – Service Worker for Red Social
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *   1. Web Push notifications (push event)
 *   2. Notification click routing (notificationclick event)
 *   3. Background sync (sync event) – optional, for offline queue
 *
 * This file must be served from the root path (/sw.js) so it has scope over
 * the entire application. In Next.js, place it in /public/sw.js.
 *
 * Registration happens in the browser via:
 *   navigator.serviceWorker.register("/sw.js")
 *
 * The push payload sent by the backend (via web-push library) must be a JSON
 * string matching the PushPayload interface defined below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

// ─── Version ──────────────────────────────────────────────────────────────────
// Bump this string to force all clients to update to the new SW.
const SW_VERSION = "1.0.0";

// ─── App URL ──────────────────────────────────────────────────────────────────
// The base URL of the Next.js application. Used to construct notification
// action URLs. This is replaced at build time via next.config.ts rewrites
// if needed; otherwise it defaults to the SW's own origin.
const APP_ORIGIN = self.location.origin;

// ─── Notification defaults ────────────────────────────────────────────────────
const DEFAULT_ICON = "/favicon.ico";
const DEFAULT_BADGE = "/favicon.ico";

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately without waiting for
  // existing clients to close.
  self.skipWaiting();
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  // Claim all open clients immediately so push events are handled by this SW.
  event.waitUntil(self.clients.claim());
});

// ─────────────────────────────────────────────────────────────────────────────
// PUSH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Push payload shape sent by the backend.
 *
 * @typedef {Object} PushPayload
 * @property {string}  title                    - Notification title
 * @property {string}  [body]                   - Notification body / description
 * @property {string}  [icon]                   - URL of the notification icon
 * @property {string}  [badge]                  - URL of the badge icon (Android)
 * @property {string}  [image]                  - Large image URL (rich notification)
 * @property {string}  [tag]                    - Notification tag (groups related notifications)
 * @property {string}  [url]                    - URL to open when the notification is clicked
 * @property {Object}  [data]                   - Arbitrary data passed to notificationclick
 * @property {string}  [data.notification_type] - e.g. "friend_request", "like", "message"
 * @property {string}  [data.entity_id]         - UUID of the related entity
 * @property {string}  [data.actor_id]          - UUID of the user who triggered the event
 * @property {Array}   [actions]                - Notification action buttons (max 2 on most browsers)
 */

self.addEventListener("push", (event) => {
  if (!event.data) {
    // Empty push – used as a "tickle" to wake the SW. Nothing to show.
    return;
  }

  let payload;

  try {
    payload = event.data.json();
  } catch {
    // If the payload is not JSON, treat the raw text as the notification body.
    payload = {
      title: "Red Social",
      body: event.data.text(),
    };
  }

  const {
    title = "Red Social",
    body = "",
    icon = DEFAULT_ICON,
    badge = DEFAULT_BADGE,
    image,
    tag,
    url,
    data = {},
    actions = [],
  } = payload;

  const notificationOptions = {
    body,
    icon,
    badge,
    image,
    tag: tag || data.notification_type || "default",
    data: {
      url: url || buildNotificationUrl(data),
      ...data,
    },
    actions: buildActions(data.notification_type, actions),
    // Show the notification even if a client tab is currently focused.
    // The client-side code decides whether to show a banner or suppress it.
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CLICK
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action; // empty string if the notification body was clicked
  const data = event.notification.data || {};
  const targetUrl = resolveActionUrl(action, data) || APP_ORIGIN;

  event.waitUntil(
    // Focus an existing tab with the target URL, or open a new one.
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Try to find an existing tab that is already on the target URL or
        // on the app origin, and focus it.
        for (const client of clients) {
          if (
            client.url === targetUrl ||
            client.url.startsWith(APP_ORIGIN)
          ) {
            return client.focus().then((focused) => {
              // Send a message to the focused tab so it can navigate to the
              // target URL without a full page reload.
              if (targetUrl !== client.url) {
                focused.postMessage({
                  type: "SW_NAVIGATE",
                  url: targetUrl,
                });
              }
              return focused;
            });
          }
        }

        // No existing tab found – open a new window.
        return self.clients.openWindow(targetUrl);
      }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CLOSE
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("notificationclose", (event) => {
  // Optionally send analytics to the backend when the user dismisses a
  // notification without clicking it. Fire-and-forget.
  const data = event.notification.data || {};
  if (data.notification_type) {
    sendBeacon("/api/analytics/events", {
      event_type: "notification_dismissed",
      entity_type: "notification",
      entity_id: data.entity_id || event.notification.tag,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE (from main thread)
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.source?.postMessage({ type: "SW_VERSION", version: SW_VERSION });
      break;

    default:
      break;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND SYNC (optional – for offline notification acknowledgements)
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    // When the browser comes back online, re-sync any pending notification
    // acknowledgements that were queued while offline.
    event.waitUntil(syncPendingAcknowledgements());
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the URL to navigate to when a notification is clicked.
 * Maps notification_type values to specific app routes.
 *
 * @param {Object} data - The notification data object from the push payload.
 * @returns {string} A fully-qualified URL or an app-relative path.
 */
function buildNotificationUrl(data) {
  const { notification_type, entity_id, actor_id } = data || {};

  switch (notification_type) {
    case "friend_request":
      return `${APP_ORIGIN}/friends`;

    case "friend_accepted":
      return actor_id
        ? `${APP_ORIGIN}/profile/${actor_id}`
        : `${APP_ORIGIN}/friends`;

    case "post_like":
    case "post_comment":
    case "post_share":
    case "post_reaction":
      return entity_id
        ? `${APP_ORIGIN}/home?post=${entity_id}`
        : `${APP_ORIGIN}/home`;

    case "comment_reply":
    case "comment_reaction":
      return entity_id
        ? `${APP_ORIGIN}/home?comment=${entity_id}`
        : `${APP_ORIGIN}/home`;

    case "message":
      return entity_id
        ? `${APP_ORIGIN}/messages/${entity_id}`
        : `${APP_ORIGIN}/messages`;

    case "group_post":
    case "group_invitation":
      return entity_id
        ? `${APP_ORIGIN}/groups/${entity_id}`
        : `${APP_ORIGIN}/groups`;

    case "event_invitation":
    case "event_reminder":
      return entity_id
        ? `${APP_ORIGIN}/events/${entity_id}`
        : `${APP_ORIGIN}/events`;

    case "page_post":
      return entity_id
        ? `${APP_ORIGIN}/pages/${entity_id}`
        : `${APP_ORIGIN}/home`;

    case "marketplace_offer":
    case "offer_accepted":
    case "offer_rejected":
      return `${APP_ORIGIN}/marketplace`;

    case "order_confirmed":
    case "order_shipped":
    case "order_delivered":
      return entity_id
        ? `${APP_ORIGIN}/orders/${entity_id}`
        : `${APP_ORIGIN}/orders`;

    case "donation_received":
      return entity_id
        ? `${APP_ORIGIN}/fundraisers/${entity_id}`
        : `${APP_ORIGIN}/fundraisers`;

    case "job_application_status":
      return `${APP_ORIGIN}/jobs/applications`;

    case "stream_start":
    case "new_subscriber":
      return `${APP_ORIGIN}/live`;

    case "tagged_in_photo":
      return entity_id
        ? `${APP_ORIGIN}/profile/${actor_id}`
        : `${APP_ORIGIN}/home`;

    case "birthday":
      return actor_id
        ? `${APP_ORIGIN}/profile/${actor_id}`
        : `${APP_ORIGIN}/friends`;

    case "memory":
      return `${APP_ORIGIN}/memories`;

    default:
      return `${APP_ORIGIN}/notifications`;
  }
}

/**
 * Build notification action buttons based on the notification type.
 * Returns at most 2 actions (browser limit for most platforms).
 *
 * @param {string} notificationType
 * @param {Array}  extraActions - Additional actions from the push payload.
 * @returns {Array<{action: string, title: string, icon?: string}>}
 */
function buildActions(notificationType, extraActions) {
  if (extraActions && extraActions.length > 0) {
    return extraActions.slice(0, 2);
  }

  switch (notificationType) {
    case "friend_request":
      return [
        { action: "accept_friend", title: "Aceptar" },
        { action: "decline_friend", title: "Rechazar" },
      ];

    case "message":
      return [{ action: "reply_message", title: "Responder" }];

    case "event_invitation":
      return [
        { action: "rsvp_going", title: "Asistiré" },
        { action: "rsvp_interested", title: "Interesado" },
      ];

    case "group_invitation":
      return [
        { action: "join_group", title: "Unirme" },
        { action: "decline_group", title: "Rechazar" },
      ];

    default:
      return [];
  }
}

/**
 * Resolve the URL for a specific notification action button click.
 *
 * @param {string} action - The action identifier (e.g. "accept_friend").
 * @param {Object} data   - The notification data object.
 * @returns {string|null} URL to navigate to, or null for the default URL.
 */
function resolveActionUrl(action, data) {
  switch (action) {
    case "accept_friend":
    case "decline_friend":
      return `${APP_ORIGIN}/friends`;

    case "reply_message":
      return data.entity_id
        ? `${APP_ORIGIN}/messages/${data.entity_id}`
        : `${APP_ORIGIN}/messages`;

    case "rsvp_going":
    case "rsvp_interested":
      return data.entity_id
        ? `${APP_ORIGIN}/events/${data.entity_id}`
        : `${APP_ORIGIN}/events`;

    case "join_group":
    case "decline_group":
      return data.entity_id
        ? `${APP_ORIGIN}/groups/${data.entity_id}`
        : `${APP_ORIGIN}/groups`;

    case "":
    default:
      // No specific action or notification body was clicked – use default URL.
      return data.url || null;
  }
}

/**
 * Fire-and-forget analytics beacon.
 * Uses `fetch` in keepalive mode so the request survives SW termination.
 *
 * @param {string} path  - API path (relative to APP_ORIGIN).
 * @param {Object} body  - JSON body.
 */
function sendBeacon(path, body) {
  try {
    fetch(`${APP_ORIGIN}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Ignore errors – this is a fire-and-forget analytics call.
    });
  } catch {
    // Ignore – SW may be shutting down.
  }
}

/**
 * Placeholder for syncing pending notification acknowledgements when the
 * browser comes back online. Extend this with IndexedDB queue reads once
 * offline queuing is implemented.
 */
async function syncPendingAcknowledgements() {
  // TODO: read from IndexedDB queue and replay POST /notifications/:id/read calls
  return Promise.resolve();
}

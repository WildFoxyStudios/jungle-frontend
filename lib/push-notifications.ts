/**
 * push-notifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Web Push API helper that works with the backend's push subscription
 * endpoints:
 *
 *   POST /api/notifications/push/subscribe
 *   POST /api/notifications/push/unsubscribe
 *
 * The backend stores each subscription (endpoint + keys) and sends push
 * messages via the Web Push Protocol (RFC 8030) whenever a notification
 * event occurs for the user.
 *
 * Browser support: Chrome 50+, Firefox 44+, Edge 17+, Safari 16+
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *
 *   import { subscribeToPush, unsubscribeFromPush, isPushSupported } from "@/lib/push-notifications";
 *
 *   // In a settings page or on first login:
 *   if (isPushSupported()) {
 *     const result = await subscribeToPush();
 *     if (result.status === "subscribed") {
 *       console.log("Push notifications enabled");
 *     }
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { notificationsApi } from "./api-notifications";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * VAPID public key from the environment.
 * Must match the VAPID_PUBLIC_KEY configured on the backend.
 *
 * If the variable is not set, push subscriptions are disabled gracefully.
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PushPermission = "granted" | "denied" | "default" | "unsupported";

export type SubscribeResult =
  | { status: "subscribed"; subscription: PushSubscription }
  | { status: "already_subscribed"; subscription: PushSubscription }
  | { status: "permission_denied" }
  | { status: "not_supported" }
  | { status: "error"; error: string };

export type UnsubscribeResult =
  | { status: "unsubscribed" }
  | { status: "not_subscribed" }
  | { status: "error"; error: string };

// ─── Feature detection ────────────────────────────────────────────────────────

/**
 * Returns true if the current browser supports the Web Push API.
 * Always false in SSR contexts (no window/ServiceWorker).
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Returns the current notification permission status.
 * Returns "unsupported" if the browser doesn't support notifications.
 */
export function getNotificationPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermission;
}

// ─── VAPID key helper ─────────────────────────────────────────────────────────

/**
 * Converts a Base64 URL-encoded VAPID public key string into a Uint8Array
 * suitable for passing to `PushManager.subscribe()`.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Pad the string to a multiple of 4 characters
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ─── Service Worker ───────────────────────────────────────────────────────────

/**
 * Returns the active Service Worker registration, waiting for it to become
 * ready if necessary. Returns null if Service Workers are not supported or
 * registration fails.
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    // navigator.serviceWorker.ready resolves when an active SW is controlling the page.
    // It will never reject; but we add a timeout just in case.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SW ready timeout")), 10_000),
      ),
    ]);
    return registration;
  } catch {
    return null;
  }
}

// ─── Core: subscribe ─────────────────────────────────────────────────────────

/**
 * Request push notification permission and subscribe the browser to push
 * notifications. If successful, the subscription is sent to the backend so
 * the server can deliver push messages to this device.
 *
 * @returns A `SubscribeResult` discriminated union describing the outcome.
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  // ── Feature check ──────────────────────────────────────────────────────────
  if (!isPushSupported()) {
    return { status: "not_supported" };
  }

  if (!VAPID_PUBLIC_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set. " +
          "Push subscriptions are disabled. " +
          "Add the key to .env.local to enable them.",
      );
    }
    return { status: "error", error: "VAPID public key is not configured." };
  }

  // ── Permission ────────────────────────────────────────────────────────────
  const currentPermission = Notification.permission;

  if (currentPermission === "denied") {
    return { status: "permission_denied" };
  }

  let permission: NotificationPermission = currentPermission;

  if (currentPermission !== "granted") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      // Some older browsers use a callback-based API and reject the Promise.
      // Fall back to the callback form.
      permission = await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission(resolve);
      });
    }
  }

  if (permission !== "granted") {
    return { status: "permission_denied" };
  }

  // ── Service Worker ────────────────────────────────────────────────────────
  const registration = await getServiceWorkerRegistration();

  if (!registration) {
    return {
      status: "error",
      error:
        "Service Worker is not available. " +
        "Make sure /sw.js is present and the app is served over HTTPS.",
    };
  }

  // ── Check for existing subscription ───────────────────────────────────────
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    // A subscription already exists in the browser. Make sure it's also
    // registered on the backend (e.g. after a re-login on the same device).
    try {
      await syncSubscriptionWithBackend(existingSubscription);
    } catch {
      // Non-fatal: the backend might already have this subscription.
    }
    return { status: "already_subscribed", subscription: existingSubscription };
  }

  // ── Create new subscription ───────────────────────────────────────────────
  let subscription: PushSubscription;

  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        .buffer as ArrayBuffer,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create push subscription";
    return { status: "error", error: message };
  }

  // ── Register with the backend ─────────────────────────────────────────────
  try {
    await syncSubscriptionWithBackend(subscription);
  } catch (err) {
    // If backend registration fails, unsubscribe from the browser too so the
    // state stays consistent.
    await subscription.unsubscribe().catch(() => {});

    const message =
      err instanceof Error
        ? err.message
        : "Failed to register subscription with the server";
    return { status: "error", error: message };
  }

  return { status: "subscribed", subscription };
}

// ─── Core: unsubscribe ────────────────────────────────────────────────────────

/**
 * Unsubscribe the current browser from push notifications and remove the
 * subscription from the backend.
 *
 * @returns An `UnsubscribeResult` discriminated union describing the outcome.
 */
export async function unsubscribeFromPush(): Promise<UnsubscribeResult> {
  if (!isPushSupported()) {
    return { status: "not_subscribed" };
  }

  const registration = await getServiceWorkerRegistration();

  if (!registration) {
    return { status: "not_subscribed" };
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return { status: "not_subscribed" };
  }

  // ── Remove from backend first ────────────────────────────────────────────
  try {
    await notificationsApi.unsubscribePush(subscription.endpoint);
  } catch {
    // Non-fatal: continue with browser-side unsubscription even if the
    // backend call fails (the subscription would naturally expire anyway).
  }

  // ── Unsubscribe in the browser ────────────────────────────────────────────
  try {
    const success = await subscription.unsubscribe();
    return success
      ? { status: "unsubscribed" }
      : { status: "error", error: "Browser unsubscription returned false" };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to unsubscribe",
    };
  }
}

// ─── Backend sync helper ──────────────────────────────────────────────────────

/**
 * Extract the p256dh and auth keys from a PushSubscription and send them to
 * the backend via `POST /notifications/push/subscribe`.
 *
 * @throws If the subscription is missing required keys or the API call fails.
 */
async function syncSubscriptionWithBackend(
  subscription: PushSubscription,
): Promise<void> {
  const rawP256dh = subscription.getKey("p256dh");
  const rawAuth = subscription.getKey("auth");

  if (!rawP256dh || !rawAuth) {
    throw new Error(
      "Push subscription is missing required keys (p256dh or auth). " +
        "This browser may not support VAPID.",
    );
  }

  const p256dh = arrayBufferToBase64(rawP256dh);
  const auth = arrayBufferToBase64(rawAuth);

  await notificationsApi.subscribePush({
    endpoint: subscription.endpoint,
    keys: { p256dh, auth },
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
}

/**
 * Convert an ArrayBuffer (returned by `PushSubscription.getKey()`) to a
 * Base64 URL-safe string expected by the backend.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── Convenience: current subscription status ─────────────────────────────────

/**
 * Returns the current PushSubscription for this browser, or null if the user
 * is not subscribed. Does not request permission or create a subscription.
 *
 * Useful for checking the initial state in a settings page.
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;

  return registration.pushManager.getSubscription();
}

/**
 * Returns true if the current browser has an active push subscription.
 */
export async function hasPushSubscription(): Promise<boolean> {
  const sub = await getCurrentPushSubscription();
  return sub !== null;
}

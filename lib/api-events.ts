import { api } from "./api";
import type { Event, EventAttendee, RsvpStatus } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateEventPayload {
  name: string;
  description?: string;
  event_type?: "public" | "private" | "friends";
  start_time: string;
  end_time?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_online?: boolean;
  online_link?: string;
  cover_url?: string;
}

export interface InviteToEventPayload {
  user_ids: string[];
}

// ─── Events API ───────────────────────────────────────────────────────────────

export const eventsApi = {
  // ── Discovery ─────────────────────────────────────────────────────────────

  /** GET /events – upcoming public events */
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<Event[]>("/events", { params }).then((r) => r.data),

  /** GET /events/upcoming – events the user has RSVP'd to */
  getUpcoming: () => api.get<Event[]>("/events/upcoming").then((r) => r.data),

  /** GET /events/my – events created by or RSVP'd "going" by the user */
  getMy: () => api.get<Event[]>("/events/my").then((r) => r.data),

  /** GET /events/:id */
  get: (eventId: string) =>
    api.get<Event>(`/events/${eventId}`).then((r) => r.data),

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** POST /events */
  create: (payload: CreateEventPayload) =>
    api.post<Event>("/events", payload).then((r) => r.data),

  // ── Attendance ────────────────────────────────────────────────────────────

  /**
   * POST /events/:id/respond
   * Backend accepts { status: 'going' | 'interested' | 'not_going' }
   */
  rsvp: (eventId: string, status: RsvpStatus) =>
    api.post(`/events/${eventId}/respond`, { status }).then((r) => r.data),

  /** GET /events/:id/attendees */
  getAttendees: (eventId: string) =>
    api
      .get<EventAttendee[]>(`/events/${eventId}/attendees`)
      .then((r) => r.data),

  // ── Invitations ───────────────────────────────────────────────────────────

  /** POST /events/:id/invite */
  invite: (eventId: string, payload: InviteToEventPayload) =>
    api.post(`/events/${eventId}/invite`, payload).then((r) => r.data),

  /** GET /events/:id/invited */
  getInvited: (eventId: string) =>
    api.get<EventAttendee[]>(`/events/${eventId}/invited`).then((r) => r.data),
};

/** @deprecated Use `eventsApi` */
export const eventApi = eventsApi;

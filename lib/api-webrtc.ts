import { api, WS_BASE_URL, tokenStorage } from "./api";
import type {
  Call,
  CallWithUsers,
  CallType,
  WebRTCConfig,
  GroupCall,
  GroupCallParticipant,
} from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface InitiateCallPayload {
  receiver_id: string;
  call_type: CallType;
}

export interface SendSignalingPayload {
  call_id: string;
  to_user_id: string;
  message_type: "offer" | "answer" | "ice-candidate";
  payload: Record<string, unknown>;
}

export interface CreateGroupCallPayload {
  call_type?: "audio" | "video";
  group_id?: string;
  conversation_id?: string;
  max_participants?: number;
}

export interface UpdateParticipantStatusPayload {
  is_audio_enabled?: boolean;
  is_video_enabled?: boolean;
  is_screen_sharing?: boolean;
}

// ─── WebRTC Signaling WebSocket ───────────────────────────────────────────────

export type SignalingMessage =
  | {
      type: "offer";
      call_id: string;
      from: string;
      to: string;
      sdp: string;
    }
  | {
      type: "answer";
      call_id: string;
      from: string;
      to: string;
      sdp: string;
    }
  | {
      type: "ice-candidate";
      call_id: string;
      from: string;
      to: string;
      candidate: string;
      sdp_mid?: string;
      sdp_m_line_index?: number;
    }
  | { type: "join-call"; call_id: string; user_id: string }
  | { type: "leave-call"; call_id: string; user_id: string }
  | { type: "join-stream"; stream_id: string; user_id: string }
  | { type: "leave-stream"; stream_id: string; user_id: string }
  | { type: "typing"; conversation_id: string; user_id: string }
  | { type: "stop-typing"; conversation_id: string; user_id: string };

/**
 * Creates a WebSocket connection to the WebRTC signaling endpoint.
 *
 * Usage:
 * ```ts
 * const ws = createSignalingSocket(userId, {
 *   onMessage: (msg) => { ... },
 *   onOpen: () => { ... },
 *   onClose: () => { ... },
 * });
 * ws.send({ type: "join-call", call_id: "...", user_id: userId });
 * ws.close();
 * ```
 */
export function createSignalingSocket(
  userId: string,
  handlers: {
    onMessage?: (msg: SignalingMessage) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: Event) => void;
  },
): WebSocket {
  const token = tokenStorage.get();
  const url = `${WS_BASE_URL}/api/webrtc/signaling/${encodeURIComponent(userId)}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  const ws = new WebSocket(url);

  ws.onopen = () => handlers.onOpen?.();
  ws.onclose = () => handlers.onClose?.();
  ws.onerror = (err) => handlers.onError?.(err);
  ws.onmessage = (evt) => {
    try {
      const msg: SignalingMessage = JSON.parse(evt.data as string);
      handlers.onMessage?.(msg);
    } catch {
      // ignore malformed frames
    }
  };

  return ws;
}

// ─── 1-to-1 Calls API ─────────────────────────────────────────────────────────

export const callsApi = {
  // ── Initiation / Control ──────────────────────────────────────────────────

  /** POST /calls/initiate – start a new outgoing call */
  initiate: (payload: InitiateCallPayload) =>
    api.post<Call>("/calls/initiate", payload).then((r) => r.data),

  /** POST /calls/:id/answer – accept an incoming call */
  answer: (callId: string) =>
    api.post(`/calls/${callId}/answer`).then((r) => r.data),

  /** POST /calls/:id/end – end an active call */
  end: (callId: string) => api.post(`/calls/${callId}/end`).then((r) => r.data),

  /** POST /calls/:id/reject – decline an incoming call */
  reject: (callId: string) =>
    api.post(`/calls/${callId}/reject`).then((r) => r.data),

  // ── Signaling (HTTP fallback) ──────────────────────────────────────────────

  /** POST /calls/signaling – send a signaling message over HTTP (fallback) */
  sendSignaling: (payload: SendSignalingPayload) =>
    api.post("/calls/signaling", payload).then((r) => r.data),

  // ── History / Detail ──────────────────────────────────────────────────────

  /** GET /calls/history – recent calls (both outgoing and incoming) */
  getHistory: () =>
    api.get<CallWithUsers[]>("/calls/history").then((r) => r.data),

  /** GET /webrtc/calls/:id – details for a specific call */
  getCall: (callId: string) =>
    api.get<Call>(`/webrtc/calls/${callId}`).then((r) => r.data),

  // ── Config ────────────────────────────────────────────────────────────────

  /** GET /webrtc/config – ICE server configuration for the RTCPeerConnection */
  getConfig: () => api.get<WebRTCConfig>("/webrtc/config").then((r) => r.data),
};

// ─── Group Calls API ──────────────────────────────────────────────────────────

export const groupCallsApi = {
  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** POST /calls/group – create a new group call room */
  create: (payload: CreateGroupCallPayload) =>
    api.post<GroupCall>("/calls/group", payload).then((r) => r.data),

  /** GET /calls/group/:id – group call details */
  get: (callId: string) =>
    api.get<GroupCall>(`/calls/group/${callId}`).then((r) => r.data),

  /** POST /calls/group/:id/join – join an active group call */
  join: (callId: string) =>
    api.post(`/calls/group/${callId}/join`).then((r) => r.data),

  /** POST /calls/group/:id/leave – leave a group call */
  leave: (callId: string) =>
    api.post(`/calls/group/${callId}/leave`).then((r) => r.data),

  /** POST /calls/group/:id/end – end the call for everyone (creator only) */
  end: (callId: string) =>
    api.post(`/calls/group/${callId}/end`).then((r) => r.data),

  // ── Participants ──────────────────────────────────────────────────────────

  /** GET /calls/group/:id/participants – list joined participants */
  getParticipants: (callId: string) =>
    api
      .get<GroupCallParticipant[]>(`/calls/group/${callId}/participants`)
      .then((r) => r.data),

  /** PUT /calls/group/:id/update – toggle audio / video / screen-share */
  updateStatus: (callId: string, payload: UpdateParticipantStatusPayload) =>
    api.put(`/calls/group/${callId}/update`, payload).then((r) => r.data),

  // ── Discovery ────────────────────────────────────────────────────────────

  /** GET /calls/active – active group calls the user can join */
  getActive: () => api.get<GroupCall[]>("/calls/active").then((r) => r.data),
};

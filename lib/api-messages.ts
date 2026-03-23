import { api } from "./api";
import type {
  Conversation,
  Message,
  SendMessagePayload,
  CreateConversationPayload,
  ConversationParticipant,
} from "./types";

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversationsApi = {
  /** GET /conversations */
  list: () => api.get<Conversation[]>("/conversations").then((r) => r.data),

  /** POST /conversations */
  create: (payload: CreateConversationPayload) =>
    api.post<Conversation>("/conversations", payload).then((r) => r.data),

  /** GET /conversations/:id  (returns paginated messages) */
  getMessages: (
    conversationId: string,
    params?: { limit?: number; before?: string },
  ) =>
    api
      .get<Message[]>(`/conversations/${conversationId}`, { params })
      .then((r) => r.data),

  /** POST /conversations/:id  (send a message) */
  sendMessage: (conversationId: string, payload: SendMessagePayload) =>
    api
      .post<Message>(`/conversations/${conversationId}`, payload)
      .then((r) => r.data),

  /** POST /conversations/:id/participants */
  addParticipants: (conversationId: string, userIds: string[]) =>
    api
      .post(`/conversations/${conversationId}/participants`, {
        user_ids: userIds,
      })
      .then((r) => r.data),

  /** GET /conversations/:id/participants */
  getParticipants: (conversationId: string) =>
    api
      .get<
        ConversationParticipant[]
      >(`/conversations/${conversationId}/participants`)
      .then((r) => r.data),

  /** POST /conversations/:id/read */
  markAsRead: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/read`).then((r) => r.data),

  /** POST /conversations/:id/mute */
  mute: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/mute`).then((r) => r.data),

  /** POST /conversations/:id/unmute */
  unmute: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/unmute`).then((r) => r.data),
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const messagesApi = {
  /** PUT /messages/:id */
  update: (messageId: string, content: string) =>
    api.put<Message>(`/messages/${messageId}`, { content }).then((r) => r.data),

  /** DELETE /messages/:id */
  delete: (messageId: string) =>
    api.delete(`/messages/${messageId}`).then((r) => r.data),

  /** POST /messages/:id/read */
  markAsRead: (messageId: string) =>
    api.post(`/messages/${messageId}/read`).then((r) => r.data),
};

// ─── Legacy default export (backwards compat) ────────────────────────────────

/** @deprecated Use named exports `conversationsApi` and `messagesApi` */
export const messageApi = {
  createConversation: (payload: CreateConversationPayload) =>
    conversationsApi.create(payload),

  getConversations: () => conversationsApi.list(),

  getMessages: (conversationId: string) =>
    conversationsApi.getMessages(conversationId),

  sendMessage: (conversationId: string, payload: SendMessagePayload) =>
    conversationsApi.sendMessage(conversationId, payload),

  markAsRead: (conversationId: string) =>
    conversationsApi.markAsRead(conversationId),

  deleteMessage: (messageId: string) => messagesApi.delete(messageId),
};

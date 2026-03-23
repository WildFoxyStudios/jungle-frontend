import { api } from "./api";
import type { PollWithOptions } from "./types";

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreatePollPayload {
  question: string;
  options: string[];
  allows_multiple_answers?: boolean;
  /** Duration in hours until the poll closes. Omit for no expiry. */
  duration_hours?: number;
}

export interface VotePollPayload {
  /** One or more option IDs to vote for */
  option_ids: string[];
}

// ─── Polls API ────────────────────────────────────────────────────────────────

export const pollsApi = {
  /**
   * POST /posts/:postId/poll
   * Attach a poll to an existing post (post must belong to the caller).
   */
  createPoll: (postId: string, payload: CreatePollPayload) =>
    api
      .post<PollWithOptions>(`/posts/${postId}/poll`, payload)
      .then((r) => r.data),

  /**
   * GET /polls/:id
   * Fetch poll details including per-option vote counts and the caller's
   * current votes.
   */
  getPoll: (pollId: string) =>
    api.get<PollWithOptions>(`/polls/${pollId}`).then((r) => r.data),

  /**
   * POST /polls/:id/vote
   * Cast (or update) the caller's vote.
   * Replaces any existing votes for this poll.
   */
  vote: (pollId: string, payload: VotePollPayload) =>
    api
      .post<PollWithOptions>(`/polls/${pollId}/vote`, payload)
      .then((r) => r.data),

  /**
   * DELETE /polls/:id/vote
   * Remove the caller's vote(s) from a poll.
   */
  removeVote: (pollId: string) =>
    api.delete(`/polls/${pollId}/vote`).then((r) => r.data),
};

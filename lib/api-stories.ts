import { api } from "./api";
import type {
  Story,
  StoryViewer,
  StoryHighlight,
  CreateStoryPayload,
} from "./types";

// ─── Stories ─────────────────────────────────────────────────────────────────

export const storiesApi = {
  /** GET /stories – active stories from friends + own */
  getStories: () => api.get<Story[]>("/stories").then((r) => r.data),

  /** POST /stories */
  createStory: (payload: CreateStoryPayload) =>
    api.post<Story>("/stories", payload).then((r) => r.data),

  /** POST /stories/:id/view */
  viewStory: (storyId: string) =>
    api.post(`/stories/${storyId}/view`).then((r) => r.data),

  /** DELETE /stories/:id */
  deleteStory: (storyId: string) =>
    api.delete(`/stories/${storyId}`).then((r) => r.data),

  /** GET /stories/:id/viewers */
  getViewers: (storyId: string) =>
    api.get<StoryViewer[]>(`/stories/${storyId}/viewers`).then((r) => r.data),

  // ── Highlights ────────────────────────────────────────────────────────────

  /** POST /stories/highlights */
  createHighlight: (payload: {
    title: string;
    cover_image_url?: string;
    story_ids: string[];
  }) =>
    api
      .post<StoryHighlight>("/stories/highlights", payload)
      .then((r) => r.data),

  /** GET /profile/:userId/highlights */
  getProfileHighlights: (userId: string) =>
    api
      .get<StoryHighlight[]>(`/profile/${userId}/highlights`)
      .then((r) => r.data),
};

/** @deprecated Use `storiesApi` */
export const storyApi = storiesApi;

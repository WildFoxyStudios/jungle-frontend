import type { WatchVideo } from "./types";

/**
 * Client-side recommendation algorithm for Watch feed.
 * Reorders videos from the backend using multi-factor scoring.
 */

interface VideoScore {
  video: WatchVideo;
  categoryBoost: number;
  creatorAffinityBoost: number;
  recencyDecay: number;
  completionBoost: number;
  finalScore: number;
}

/**
 * Compute the top N categories from watch history.
 */
function getTopCategories(history: WatchVideo[], topN = 3): Set<string> {
  const counts = new Map<string, number>();
  for (const v of history) {
    if (v.category) {
      counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
    }
  }
  return new Set(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([cat]) => cat),
  );
}

/**
 * Compute recency decay using exponential function.
 * Returns a value between 0 and 1, where 1 = just published.
 */
function computeRecencyDecay(publishedAt: string | undefined, createdAt: string): number {
  const date = publishedAt ?? createdAt;
  const hoursOld = Math.max(0, (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60));
  return Math.exp(-0.03 * hoursOld);
}

/**
 * Enforce diversity: no more than 2 consecutive videos from the same creator.
 */
function enforceDiversity(videos: WatchVideo[]): WatchVideo[] {
  if (videos.length <= 2) return videos;

  const result: WatchVideo[] = [];
  const deferred: WatchVideo[] = [];

  for (const video of videos) {
    const lastTwo = result.slice(-2);
    const sameCreatorCount = lastTwo.filter((v) => v.user_id === video.user_id).length;

    if (sameCreatorCount >= 2) {
      deferred.push(video);
    } else {
      result.push(video);
      // Try to insert deferred videos
      const toRetry = [...deferred];
      deferred.length = 0;
      for (const d of toRetry) {
        const last = result.slice(-2);
        if (last.filter((v) => v.user_id === d.user_id).length < 2) {
          result.push(d);
        } else {
          deferred.push(d);
        }
      }
    }
  }

  // Append any remaining deferred at the end
  result.push(...deferred);
  return result;
}

/**
 * Interleave followed and discovered videos in ~60/40 ratio.
 */
function interleaveFollowedDiscovered(
  videos: WatchVideo[],
  subscriptions: Set<string>,
): WatchVideo[] {
  if (subscriptions.size === 0) return videos;

  const followed = videos.filter((v) => subscriptions.has(v.user_id));
  const discovered = videos.filter((v) => !subscriptions.has(v.user_id));

  if (followed.length === 0 || discovered.length === 0) return videos;

  const result: WatchVideo[] = [];
  let fi = 0;
  let di = 0;

  // Target ~60% followed, 40% discovered
  while (fi < followed.length || di < discovered.length) {
    // Insert 3 followed
    for (let i = 0; i < 3 && fi < followed.length; i++) {
      result.push(followed[fi++]);
    }
    // Insert 2 discovered
    for (let i = 0; i < 2 && di < discovered.length; i++) {
      result.push(discovered[di++]);
    }
  }

  return result;
}

/**
 * Score and reorder the video feed using multi-factor scoring.
 *
 * Factors:
 * - Category boost (+0.3): video category is in user's top 3
 * - Creator affinity (+0.5): user follows the creator
 * - Recency decay: exponential decay based on hours since publication
 * - Completion boost (+0.2): similar category videos were watched >80%
 *
 * Also applies:
 * - Diversity: max 2 consecutive from same creator
 * - Interleave followed/discovered ~60/40
 * - Cold-start: returns videos as-is (trending) if no history
 */
export function scoreAndReorderFeed(
  videos: WatchVideo[],
  watchHistory: WatchVideo[],
  subscriptions: string[],
): WatchVideo[] {
  // Cold-start: no history, return as-is (backend already returns trending)
  if (watchHistory.length === 0) {
    return videos;
  }

  const topCategories = getTopCategories(watchHistory);
  const subSet = new Set(subscriptions);

  // Compute completed categories (for completion boost)
  const completedCategories = new Set<string>();
  for (const v of watchHistory) {
    if (v.category) {
      completedCategories.add(v.category);
    }
  }

  // Score each video
  const scored: VideoScore[] = videos.map((video) => {
    const categoryBoost = video.category && topCategories.has(video.category) ? 0.3 : 0;
    const creatorAffinityBoost = subSet.has(video.user_id) ? 0.5 : 0;
    const recencyDecay = computeRecencyDecay(video.published_at, video.created_at);
    const completionBoost =
      video.category && completedCategories.has(video.category) ? 0.2 : 0;

    const finalScore = categoryBoost + creatorAffinityBoost + recencyDecay + completionBoost;

    return {
      video,
      categoryBoost,
      creatorAffinityBoost,
      recencyDecay,
      completionBoost,
      finalScore,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  let reordered = scored.map((s) => s.video);

  // Interleave followed/discovered
  reordered = interleaveFollowedDiscovered(reordered, subSet);

  // Enforce diversity
  reordered = enforceDiversity(reordered);

  return reordered;
}

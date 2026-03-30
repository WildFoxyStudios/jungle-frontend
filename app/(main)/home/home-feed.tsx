"use client";

import { useState, useCallback, useMemo } from "react";
import { SidebarRight } from "@/components/layout/sidebar-right";
import { CreatePost } from "@/components/feed/create-post";
import { PostCard } from "@/components/feed/post-card";
import { StoriesBar } from "@/components/feed/stories-bar";
import { PostSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { postsApi } from "@/lib/api-posts";
import { useInfiniteApi } from "@/hooks/useApi";
import { Rss, RefreshCw } from "lucide-react";
import type { Post, PostWithDetails } from "@/lib/types";

/** Flatten PostWithDetails into a Post with user info populated */
function flattenPost(pwd: PostWithDetails): Post {
  const p = pwd.post;
  return {
    ...p,
    user_name: pwd.author.full_name || pwd.author.username,
    user_profile_picture: pwd.author.profile_picture_url,
    is_purchased: pwd.is_purchased,
    is_subscribed: pwd.is_subscribed,
  };
}

interface FeedPostMeta {
  my_reaction?: string;
  is_saved: boolean;
}

export function HomeFeed() {
  const {
    items: rawPosts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteApi(
    (offset, limit) => postsApi.getFeed(limit, offset),
    [],
    15,
  );

  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  // Track updates to feed posts (e.g., poll votes) without refetching
  const [postUpdates, setPostUpdates] = useState<Record<string, Post>>({});

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  // Transform PostWithDetails to flat Posts and extract metadata
  const feedData = useMemo(() => {
    const posts: Post[] = [];
    const meta: Record<string, FeedPostMeta> = {};

    for (const raw of rawPosts) {
      // Handle both PostWithDetails (has .post) and plain Post (legacy)
      const isDetailed = raw && typeof raw === "object" && "post" in raw && "author" in raw;
      if (isDetailed) {
        const pwd = raw as PostWithDetails;
        const flat = flattenPost(pwd);
        posts.push(flat);
        meta[flat.id] = {
          my_reaction: pwd.my_reaction ?? undefined,
          is_saved: pwd.is_saved,
        };
      } else {
        // Legacy: already flat
        const p = raw as unknown as Post;
        posts.push(p);
        meta[p.id] = { is_saved: false };
      }
    }

    return { posts, meta };
  }, [rawPosts]);

  const allPosts = [...localPosts, ...feedData.posts].map(
    p => postUpdates[p.id] || p
  );

  const handleDelete = useCallback((id: string) => {
    setLocalPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleUpdate = useCallback((post: Post) => {
    setLocalPosts(prev => prev.map(p => p.id === post.id ? post : p));
    // Also track updates for feed posts (poll votes, etc.)
    setPostUpdates(prev => ({ ...prev, [post.id]: post }));
  }, []);

  return (
    <div className="flex gap-3 sm:gap-5 p-2 sm:p-4 lg:p-6 max-w-[1200px] mx-auto">
      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
        {/* Stories */}
        <div className="surface p-3 sm:p-4">
          <StoriesBar />
        </div>

        {/* Create post */}
        <CreatePost onCreated={p => setLocalPosts(prev => [p, ...prev])} />

        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}

        {/* Empty state */}
        {!loading && allPosts.length === 0 && (
          <EmptyState
            icon={<Rss size={32} />}
            title="Tu feed está vacío"
            description="Empieza a seguir amigos y páginas para ver publicaciones aquí."
            action={
              <Button
                onClick={refresh}
                leftIcon={<RefreshCw size={16} />}
                variant="secondary"
              >
                Actualizar
              </Button>
            }
          />
        )}

        {/* Posts */}
        {allPosts.map((post, i) => {
          const meta = feedData.meta[post.id];
          return (
            <div key={post.id} className={`stagger-${Math.min((i % 5) + 1, 5)}`}>
              <PostCard
                post={post}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                initialReaction={meta?.my_reaction}
                initialSaved={meta?.is_saved}
              />
            </div>
          );
        })}

        {/* Load more skeletons */}
        {loadingMore && (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {/* End of feed */}
        {!hasMore && allPosts.length > 0 && (
          <p className="text-center text-sm text-[#65676b] dark:text-[#b0b3b8] py-4">
            Has llegado al final del feed 🎉
          </p>
        )}
      </div>

      {/* Right sidebar */}
      <SidebarRight />
    </div>
  );
}

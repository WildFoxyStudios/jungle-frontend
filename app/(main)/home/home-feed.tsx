"use client";

import { useState, useCallback } from "react";
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
import type { Post } from "@/lib/types";

export function HomeFeed() {
  const {
    items: posts,
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

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    loading: loadingMore,
  });

  const allPosts = [...localPosts, ...posts];

  const handleDelete = useCallback((id: string) => {
    setLocalPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="flex gap-5 p-4 lg:p-6 max-w-[1200px] mx-auto">
      {/* Main column */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Stories */}
        <div className="surface p-4">
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
        {allPosts.map((post, i) => (
          <div key={post.id} className={`stagger-${Math.min((i % 5) + 1, 5)}`}>
            <PostCard
              post={post}
              onDelete={handleDelete}
            />
          </div>
        ))}

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
          <p className="text-center text-sm text-slate-400 py-4">
            Has llegado al final del feed 🎉
          </p>
        )}
      </div>

      {/* Right sidebar */}
      <SidebarRight />
    </div>
  );
}

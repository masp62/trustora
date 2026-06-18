"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PostCard, type PostCardData } from "@/components/post-card";
import { ExploreEmpty, ExploreNoResults } from "@/components/explore/empty-state";
import { PostCardSkeletonGrid } from "@/components/explore/post-card-skeleton";
import type { FilterState } from "@/lib/explore-filters";
import { EXPLORE_PAGE_SIZE } from "@/lib/explore-feed";

type ExploreFeedClientProps = {
  initialPosts: PostCardData[];
  initialHasMore: boolean;
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
  filters: FilterState;
  hasActiveFilters: boolean;
};

type ExploreApiResponse = {
  posts: PostCardData[];
  hasMore: boolean;
};

export function ExploreFeedClient({
  initialPosts,
  initialHasMore,
  isAuthenticated,
  googleAuthConfigured,
  filters,
  hasActiveFilters,
}: ExploreFeedClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filterKey = useMemo(
    () => JSON.stringify(filters),
    [filters],
  );

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialHasMore);
    setIsLoading(false);
    setError(null);
  }, [filterKey, initialHasMore, initialPosts]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.country) params.set("country", filters.country);
      if (filters.city) params.set("city", filters.city);
      if (filters.tripType) params.set("tripType", filters.tripType);
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
      params.set("offset", String(posts.length));
      params.set("limit", String(EXPLORE_PAGE_SIZE));

      const response = await fetch(`/api/explore?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load more posts (${response.status})`);
      }

      const data = (await response.json()) as ExploreApiResponse;
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        const incoming = data.posts.filter((post) => !seen.has(post.id));
        return [...current, ...incoming];
      });
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load more stories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, hasMore, isLoading, posts.length]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (posts.length === 0) {
    return hasActiveFilters ? <ExploreNoResults /> : <ExploreEmpty />;
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isAuthenticated={isAuthenticated}
            googleAuthConfigured={googleAuthConfigured}
          />
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="mt-2 inline-flex rounded-full border border-red-300 px-3 py-1 font-medium text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="mt-8">
          <PostCardSkeletonGrid count={3} />
          <p className="mt-4 text-center text-sm text-gray-400">Loading more stories...</p>
        </div>
      )}

      {!isLoading && hasMore && <div ref={sentinelRef} className="h-8" aria-hidden="true" />}

      {!hasMore && (
        <p className="mt-8 text-center text-sm text-gray-400">You reached the end of the feed.</p>
      )}
    </>
  );
}

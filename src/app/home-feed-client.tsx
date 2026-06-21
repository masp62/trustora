"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PostCard, type PostCardData } from "@/components/post-card";
import { HomeFeedEmpty } from "@/components/explore/empty-state";
import { PostCardSkeletonGrid } from "@/components/explore/post-card-skeleton";
import { HOME_PAGE_SIZE } from "@/lib/home-feed-constants";

type HomeFeedClientProps = {
  initialPosts: PostCardData[];
  initialHasMore: boolean;
  initialNextCursor: string | null;
  followsAny: boolean;
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
};

type HomeApiResponse = {
  posts: PostCardData[];
  hasMore: boolean;
  nextCursor: string | null;
  followsAny: boolean;
};

export function HomeFeedClient({
  initialPosts,
  initialHasMore,
  initialNextCursor,
  followsAny,
  isAuthenticated,
  googleAuthConfigured,
}: HomeFeedClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", String(HOME_PAGE_SIZE));
      if (nextCursor) {
        params.set("cursor", nextCursor);
      }

      const response = await fetch(`/api/home?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load home feed (${response.status})`);
      }

      const data = (await response.json()) as HomeApiResponse;
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        const incoming = data.posts.filter((post) => !seen.has(post.id));
        return [...current, ...incoming];
      });
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch {
      setError("Could not load more stories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, nextCursor]);

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

  if (!followsAny) {
    return <HomeFeedEmpty />;
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
        <h2 className="font-heading text-xl text-gray-900">No new stories yet</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          The travelers you follow have not posted anything yet.
        </p>
      </div>
    );
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
        <p className="mt-8 text-center text-sm text-gray-400">You reached the end of your feed.</p>
      )}
    </>
  );
}

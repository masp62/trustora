import { Suspense } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { auth, googleAuthConfigured } from "@/auth";
import { db } from "@/lib/db";
import { PostCard, type PostCardData } from "@/components/post-card";
import { ExploreEmpty, ExploreNoResults } from "@/components/explore/empty-state";
import { FilterPanel } from "@/components/explore/filter-panel";
import { parseFiltersFromParams } from "@/lib/explore-filters";
import { PostCardSkeletonGrid } from "@/components/explore/post-card-skeleton";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

interface ExploreSearchParams {
  country?: string;
  city?: string;
  tripType?: string;
  tags?: string;
}

async function getExplorePosts(
  viewerId: string | null,
  filters: { country: string; city: string; tripType: string; tags: string[] },
): Promise<PostCardData[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const where: any = {};

  if (filters.country) {
    where.locationCountry = {
      contains: filters.country,
      mode: "insensitive",
    };
  }
  if (filters.city) {
    where.locationCity = { contains: filters.city, mode: "insensitive" };
  }
  if (filters.tripType) {
    where.tripType = filters.tripType;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const posts = (await db.experiencePost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
  })) as Array<{
    id: string;
    slug: string;
    title: string;
    locationCity: string;
    locationCountry: string;
    tripType: string;
    authorId: string;
  }>;

  // If tag filter is active, fetch postTags and filter in-memory
  let filteredPosts = posts;
  if (filters.tags.length > 0) {
    const tagRecords = (await db.tag.findMany({
      where: { name: { in: filters.tags } },
    })) as Array<{ id: string; name: string }>;

    const tagIds = new Set(tagRecords.map((t) => t.id));
    if (tagIds.size > 0) {
      const postTagEntries = (await db.postTag.findMany({
        where: { postId: { in: posts.map((p) => p.id) } },
      })) as Array<{ postId: string; tagId: string }>;

      const postIdsWithTags = new Set(
        postTagEntries
          .filter((pt) => tagIds.has(pt.tagId))
          .map((pt) => pt.postId),
      );
      filteredPosts = posts.filter((p) => postIdsWithTags.has(p.id));
    } else {
      filteredPosts = [];
    }
  }

  const postIds = filteredPosts.map((post) => post.id);
  const likedPostIds = new Set<string>();

  if (viewerId && postIds.length > 0) {
    const likedPosts = (await db.like.findMany({
      where: {
        userId: viewerId,
        postId: { in: postIds },
      },
      select: { postId: true },
    })) as Array<{ postId: string }>;

    likedPosts.forEach((entry) => likedPostIds.add(entry.postId));
  }

  const cards: PostCardData[] = [];

  for (const post of filteredPosts) {
    const [author, images, likeCount] = await Promise.all([
      db.user.findUnique({
        where: { id: post.authorId },
        select: { username: true, displayName: true, avatarUrl: true },
      }) as Promise<{ username: string; displayName: string; avatarUrl: string | null } | null>,
      db.postImage.findMany({
        where: { postId: post.id },
        orderBy: { order: "asc" },
        take: 1,
      }) as Promise<Array<{ cloudinaryUrl: string; order: number }>>,
      db.like.count({ where: { postId: post.id } }),
    ]);

    if (!author) continue;

    cards.push({
      id: post.id,
      slug: post.slug,
      title: post.title,
      locationCity: post.locationCity,
      locationCountry: post.locationCountry,
      tripType: post.tripType,
      leadImageUrl: images[0]?.cloudinaryUrl ?? null,
      author,
      likeCount,
      initiallyLiked: likedPostIds.has(post.id),
    });
  }

  return cards;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;
  const sp = new URLSearchParams();
  if (params.country) sp.set("country", params.country);
  if (params.city) sp.set("city", params.city);
  if (params.tripType) sp.set("tripType", params.tripType);
  if (params.tags) sp.set("tags", params.tags);

  const filters = parseFiltersFromParams(sp);
  const hasActiveFilters =
    !!filters.country ||
    !!filters.city ||
    !!filters.tripType ||
    filters.tags.length > 0;

  const posts = await getExplorePosts(session?.user?.id ?? null, filters);
  const isAuthenticated = !!session?.user;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      {/* Hero */}
      <section className="mx-auto mb-10 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Explore</p>
        <h1 className="mt-4 max-w-2xl font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">
          Discover real travel stay stories.
        </h1>

        <OnboardingPrompt />

        {session?.user && (
          <>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-hover"
              >
                <PenLine className="size-4" />
                Share your experience
              </Link>
            </div>
            <Suspense>
              <ProfileSetupDialog
                initialDisplayName={session.user.name ?? ""}
                initialBio=""
                initialLocation=""
              />
            </Suspense>
          </>
        )}
      </section>

      {/* Filter Panel */}
      <section className="mx-auto mb-6 w-full max-w-[1760px]">
        <Suspense>
          <FilterPanel />
        </Suspense>
      </section>

      {/* Post Feed */}
      <section className="mx-auto w-full max-w-[1760px]">
        {posts.length === 0 ? (
          hasActiveFilters ? (
            <ExploreNoResults />
          ) : (
            <ExploreEmpty />
          )
        ) : (
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
        )}

        {/* Infinite scroll loading indicator (preview — triggers will be wired in #16) */}
        {posts.length >= 20 && (
          <div className="mt-8">
            <PostCardSkeletonGrid count={3} />
            <p className="mt-4 text-center text-sm text-gray-400">
              Loading more stories…
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { auth, googleAuthConfigured } from "@/auth";
import { db } from "@/lib/db";
import { PostCard, type PostCardData } from "@/components/post-card";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

async function getExplorePosts(viewerId: string | null): Promise<PostCardData[]> {
  const posts = (await db.experiencePost.findMany({
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

  const postIds = posts.map((post) => post.id);
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

  for (const post of posts) {
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

export default async function ExplorePage() {
  const session = await auth();
  const posts = await getExplorePosts(session?.user?.id ?? null);
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

      {/* Post Feed */}
      <section className="mx-auto w-full max-w-[1760px]">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="font-heading text-xl text-gray-600">No stories yet.</p>
            <p className="mt-2 text-sm text-gray-500">Be the first to share your travel experience!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
      </section>
    </main>
  );
}

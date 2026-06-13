import { Suspense } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PostCard, type PostCardData } from "@/components/post-card";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

async function getExplorePosts(): Promise<PostCardData[]> {
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
    });
  }

  return cards;
}

export default async function ExplorePage() {
  const [session, posts] = await Promise.all([auth(), getExplorePosts()]);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      {/* Hero */}
      <section className="mx-auto mb-10 w-full max-w-[1760px] rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">Explore</p>
        <h1 className="mt-4 max-w-2xl font-heading text-4xl leading-tight text-stone-900 sm:text-6xl">
          Discover real travel stay stories.
        </h1>

        <OnboardingPrompt />

        {session?.user && (
          <>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500"
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
          <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-12 text-center">
            <p className="font-heading text-xl text-stone-600">No stories yet.</p>
            <p className="mt-2 text-sm text-stone-500">Be the first to share your travel experience!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

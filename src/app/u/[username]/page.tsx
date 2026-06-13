import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { db } from "@/lib/db";
import { postCanonicalPath } from "@/app/post/post-detail-data";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

async function getUserProfile(username: string) {
  const user = (await db.user.findUnique({
    where: { username },
  })) as {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    createdAt: Date;
  } | null;

  if (!user) return null;

  const [postCount, followerCount, followingCount, posts] = await Promise.all([
    db.experiencePost.count({ where: { authorId: user.id } }),
    db.follow.count({ where: { followingId: user.id } }),
    db.follow.count({ where: { followerId: user.id } }),
    db.experiencePost.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }) as Promise<
      Array<{
        id: string;
        slug: string;
        title: string;
        locationCity: string;
        locationCountry: string;
      }>
    >,
  ]);

  const postsWithImages = await Promise.all(
    posts.map(async (post) => {
      const images = (await db.postImage.findMany({
        where: { postId: post.id },
        orderBy: { order: "asc" },
        take: 1,
      })) as Array<{ cloudinaryUrl: string }>;
      return { ...post, leadImageUrl: images[0]?.cloudinaryUrl ?? null };
    }),
  );

  return {
    user: {
      ...user,
      _count: { posts: postCount, followers: followerCount, following: followingCount },
    },
    posts: postsWithImages,
  };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getUserProfile(username);
  if (!profile) return { title: "User not found" };

  return {
    title: `${profile.user.displayName} (@${profile.user.username}) · RealBnB`,
    description: profile.user.bio ?? `Travel stories by ${profile.user.displayName}`,
  };
}

function formatJoinDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) notFound();

  const { user, posts } = profile;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mx-auto w-full max-w-[1760px] space-y-8">
        {/* Profile Header */}
        <section className="rounded-[2rem] border border-stone-200/80 bg-white/95 p-6 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="size-24 rounded-full border-2 border-amber-200 object-cover sm:size-28"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-100 text-3xl font-bold text-amber-900 sm:size-28">
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl text-stone-900 sm:text-3xl">
                {user.displayName}
              </h1>
              <p className="mt-1 text-sm text-stone-500">@{user.username}</p>

              {user.bio && (
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-700">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-stone-600 sm:justify-start">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-amber-600" />
                    {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5 text-amber-600" />
                  Joined {formatJoinDate(user.createdAt)}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm sm:justify-start">
                <span>
                  <span className="font-semibold text-stone-900">{user._count.posts}</span>{" "}
                  <span className="text-stone-500">posts</span>
                </span>
                <span>
                  <span className="font-semibold text-stone-900">{user._count.followers}</span>{" "}
                  <span className="text-stone-500">followers</span>
                </span>
                <span>
                  <span className="font-semibold text-stone-900">{user._count.following}</span>{" "}
                  <span className="text-stone-500">following</span>
                </span>
              </div>

              {/* Follow button placeholder — will be wired in task #12 */}
              <div className="mt-5">
                <button
                  className="rounded-full border border-amber-300 bg-amber-50 px-6 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                  disabled
                  title="Follow feature coming soon"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Post Grid */}
        <section>
          <h2 className="mb-4 font-heading text-xl text-stone-900">Posts</h2>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-10 text-center">
              <p className="text-sm text-stone-500">No posts yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {posts.map((post) => {
                const href = postCanonicalPath(post.id, post.slug);
                return (
                  <Link
                    key={post.id}
                    href={href}
                    className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 shadow-md transition hover:shadow-lg"
                  >
                    {post.leadImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.leadImageUrl}
                        alt={post.title}
                        className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-amber-50">
                        <MapPin className="size-8 text-amber-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold text-stone-900">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500">
                        {post.locationCity}, {post.locationCountry}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

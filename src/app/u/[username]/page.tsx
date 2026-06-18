import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, PenLine } from "lucide-react";

import { auth, googleAuthConfigured } from "@/auth";
import { db } from "@/lib/db";
import { postCanonicalPath } from "@/app/post/post-detail-data";
import { FollowButton } from "@/components/follow-button";

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

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const isOwnProfile = currentUserId === profile.user.id;
  const currentUserFollowCount = currentUserId
    ? await db.follow.count({
        where: {
          followerId: currentUserId,
          followingId: profile.user.id,
        },
      })
    : 0;

  const { user, posts } = profile;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mx-auto w-full max-w-[1760px] space-y-8">
        {/* Profile Header */}
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="size-24 rounded-full border-2 border-gray-200 object-cover sm:size-28"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-3xl font-bold text-gray-700 sm:size-28">
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl text-gray-900 sm:text-3xl">
                {user.displayName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">@{user.username}</p>

              {user.bio && (
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-700">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 sm:justify-start">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-brand-accent" />
                    {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5 text-brand-accent" />
                  Joined {formatJoinDate(user.createdAt)}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm sm:justify-start">
                <span>
                  <span className="font-semibold text-gray-900">{user._count.posts}</span>{" "}
                  <span className="text-gray-500">posts</span>
                </span>
                <Link href={`/u/${user.username}/followers`} className="transition hover:text-brand">
                  <span className="font-semibold text-gray-900">{user._count.followers}</span>{" "}
                  <span className="text-gray-500">followers</span>
                </Link>
                <Link href={`/u/${user.username}/following`} className="transition hover:text-brand">
                  <span className="font-semibold text-gray-900">{user._count.following}</span>{" "}
                  <span className="text-gray-500">following</span>
                </Link>
              </div>

              {!isOwnProfile && (
                <div className="mt-5">
                  <FollowButton
                    targetUserId={user.id}
                    targetUsername={user.username}
                    initiallyFollowing={currentUserFollowCount > 0}
                    isAuthenticated={!!session?.user}
                    googleAuthConfigured={googleAuthConfigured}
                  />
                </div>
              )}

              {isOwnProfile && (
                <div className="mt-5">
                  <Link
                    href={`/u/${user.username}/edit`}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <PenLine className="size-3.5" />
                    Edit profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Post Grid */}
        <section>
          <h2 className="mb-4 font-heading text-xl text-gray-900">Posts</h2>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <p className="text-sm text-gray-500">No posts yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {posts.map((post) => {
                const href = postCanonicalPath(post.id, post.slug);
                return (
                  <Link
                    key={post.id}
                    href={href}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {post.leadImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.leadImageUrl}
                        alt={post.title}
                        className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-gray-50">
                        <MapPin className="size-8 text-gray-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
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

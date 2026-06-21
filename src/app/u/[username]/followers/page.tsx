import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

type FollowersPageProps = {
  params: Promise<{ username: string }>;
};

async function getFollowersPageData(username: string) {
  const user = (await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  })) as {
    id: string;
    username: string;
    displayName: string;
  } | null;

  if (!user) {
    return null;
  }

  const follows = (await db.follow.findMany({
    where: { followingId: user.id },
    orderBy: { createdAt: "desc" },
    select: { followerId: true },
  })) as Array<{ followerId: string }>;

  const followerIds = follows.map((entry) => entry.followerId);

  const followers = followerIds.length
    ? ((await db.user.findMany({
        where: { id: { in: followerIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      })) as Array<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
      }>)
    : [];

  const followerMap = new Map(followers.map((entry) => [entry.id, entry]));

  return {
    user,
    followers: followerIds
      .map((id) => followerMap.get(id))
      .filter((entry): entry is NonNullable<typeof entry> => !!entry),
  };
}

export async function generateMetadata({ params }: FollowersPageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getFollowersPageData(username);

  if (!data) {
    return { title: "User not found" };
  }

  return {
    title: `Followers of @${data.user.username} Â· Trustora`,
    description: `People who follow ${data.user.displayName} on Trustora.`,
  };
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { username } = await params;
  const data = await getFollowersPageData(username);

  if (!data) {
    notFound();
  }

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-3xl space-y-6 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-2">
          <Link href={`/u/${data.user.username}`} className="text-sm font-semibold text-brand hover:text-brand-hover">
            Back to profile
          </Link>
          <h1 className="font-heading text-3xl text-gray-900">Followers</h1>
          <p className="text-sm text-gray-600">
            {data.followers.length} follower{data.followers.length === 1 ? "" : "s"} of @
            {data.user.username}
          </p>
        </header>

        {data.followers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-600">
            No followers yet.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Followers list">
            {data.followers.map((follower) => (
              <li key={follower.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Link href={`/u/${follower.username}`} className="flex items-center gap-3 transition hover:opacity-85">
                  {follower.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={follower.avatarUrl}
                      alt={follower.displayName}
                      className="size-11 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                      {follower.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{follower.displayName}</p>
                    <p className="text-sm text-gray-600">@{follower.username}</p>
                    {follower.bio && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{follower.bio}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}


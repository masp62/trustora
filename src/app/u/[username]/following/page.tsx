import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

type FollowingPageProps = {
  params: Promise<{ username: string }>;
};

async function getFollowingPageData(username: string) {
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
    where: { followerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { followingId: true },
  })) as Array<{ followingId: string }>;

  const followingIds = follows.map((entry) => entry.followingId);

  const following = followingIds.length
    ? ((await db.user.findMany({
        where: { id: { in: followingIds } },
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

  const followingMap = new Map(following.map((entry) => [entry.id, entry]));

  return {
    user,
    following: followingIds
      .map((id) => followingMap.get(id))
      .filter((entry): entry is NonNullable<typeof entry> => !!entry),
  };
}

export async function generateMetadata({ params }: FollowingPageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getFollowingPageData(username);

  if (!data) {
    return { title: "User not found" };
  }

  return {
    title: `Following of @${data.user.username} · RealBnB`,
    description: `People that ${data.user.displayName} follows on RealBnB.`,
  };
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { username } = await params;
  const data = await getFollowingPageData(username);

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
          <h1 className="font-heading text-3xl text-gray-900">Following</h1>
          <p className="text-sm text-gray-600">
            {data.following.length} account{data.following.length === 1 ? "" : "s"} followed by @
            {data.user.username}
          </p>
        </header>

        {data.following.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-sm text-gray-600">
            Not following anyone yet.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Following list">
            {data.following.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Link href={`/u/${entry.username}`} className="flex items-center gap-3 transition hover:opacity-85">
                  {entry.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.avatarUrl}
                      alt={entry.displayName}
                      className="size-11 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700">
                      {entry.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{entry.displayName}</p>
                    <p className="text-sm text-gray-600">@{entry.username}</p>
                    {entry.bio && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{entry.bio}</p>}
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

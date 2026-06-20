import { db } from "@/lib/db";
import type { PostCardData } from "@/components/post-card";

export const HOME_PAGE_SIZE = 20;

type HomePageCursor = {
  createdAtMs: number;
  id: string;
};

export type HomeFeedPageResult = {
  posts: PostCardData[];
  hasMore: boolean;
  nextCursor: string | null;
  followsAny: boolean;
};

function encodeCursor(cursor: HomePageCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string): HomePageCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<HomePageCursor>;
    if (typeof parsed.createdAtMs !== "number" || typeof parsed.id !== "string") {
      return null;
    }

    return {
      createdAtMs: parsed.createdAtMs,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

export async function getHomeFeedPage(
  viewerId: string,
  cursor: string | null = null,
  take = HOME_PAGE_SIZE,
): Promise<HomeFeedPageResult> {
  const followed = (await db.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  })) as Array<{ followingId: string }>;

  if (followed.length === 0) {
    return {
      posts: [],
      hasMore: false,
      nextCursor: null,
      followsAny: false,
    };
  }

  const followedIds = followed.map((entry) => entry.followingId);

  const allPosts = (await db.experiencePost.findMany({
    where: {
      authorId: { in: followedIds },
    },
    orderBy: { createdAt: "desc" },
  })) as Array<{
    id: string;
    slug: string;
    title: string;
    locationCity: string;
    locationCountry: string;
    tripType: string;
    authorId: string;
    createdAt: Date;
  }>;

  const sortedPosts = [...allPosts].sort((left, right) => {
    const createdDiff = right.createdAt.getTime() - left.createdAt.getTime();
    if (createdDiff !== 0) {
      return createdDiff;
    }

    return right.id.localeCompare(left.id);
  });

  const decodedCursor = cursor ? decodeCursor(cursor) : null;
  const startIndex = decodedCursor
    ? sortedPosts.findIndex(
        (post) =>
          post.id === decodedCursor.id &&
          post.createdAt.getTime() === decodedCursor.createdAtMs,
      ) + 1
    : 0;
  const safeStartIndex = Math.max(0, startIndex);

  const pagePosts = sortedPosts.slice(safeStartIndex, safeStartIndex + take);
  const hasMore = sortedPosts.length > safeStartIndex + take;
  const lastPost = pagePosts.at(-1);
  const nextCursor = hasMore && lastPost
    ? encodeCursor({
        id: lastPost.id,
        createdAtMs: lastPost.createdAt.getTime(),
      })
    : null;

  const pagePostIds = pagePosts.map((post) => post.id);
  const likedPosts = (await db.like.findMany({
    where: {
      userId: viewerId,
      postId: { in: pagePostIds },
    },
    select: { postId: true },
  })) as Array<{ postId: string }>;
  const likedPostIds = new Set(likedPosts.map((entry) => entry.postId));

  const cards: Array<PostCardData | null> = await Promise.all(
    pagePosts.map(async (post) => {
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

      if (!author) {
        return null;
      }

      return {
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
      };
    }),
  );

  return {
    posts: cards.filter((card): card is PostCardData => card !== null),
    hasMore,
    nextCursor,
    followsAny: true,
  };
}

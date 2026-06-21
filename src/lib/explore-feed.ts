import { db } from "@/lib/db";
import type { PostCardData } from "@/components/post-card";
import type { FilterState } from "@/lib/explore-filters";

export const EXPLORE_PAGE_SIZE = 20;

type ExplorePageResult = {
  posts: PostCardData[];
  hasMore: boolean;
  nextCursor: string | null;
};

type ExploreCursor = {
  createdAtMs: number;
  engagementScore: number;
  id: string;
};

function encodeCursor(cursor: ExploreCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string): ExploreCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<ExploreCursor>;
    if (
      typeof parsed.createdAtMs !== "number" ||
      typeof parsed.engagementScore !== "number" ||
      typeof parsed.id !== "string"
    ) {
      return null;
    }
    return {
      createdAtMs: parsed.createdAtMs,
      engagementScore: parsed.engagementScore,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

export async function getExplorePostsPage(
  viewerId: string | null,
  filters: FilterState,
  cursor: string | null = null,
  take = EXPLORE_PAGE_SIZE,
): Promise<ExplorePageResult> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const where: any = { status: "published" };

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

  const allPosts = (await db.experiencePost.findMany({
    where,
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

  let filteredPosts = allPosts;
  if (filters.tags.length > 0) {
    const tagRecords = (await db.tag.findMany({
      where: { name: { in: filters.tags } },
    })) as Array<{ id: string; name: string }>;

    const tagIds = new Set(tagRecords.map((t) => t.id));
    if (tagIds.size > 0) {
      const postTagEntries = (await db.postTag.findMany({
        where: { postId: { in: allPosts.map((p) => p.id) } },
      })) as Array<{ postId: string; tagId: string }>;

      const postIdsWithTags = new Set(
        postTagEntries
          .filter((pt) => tagIds.has(pt.tagId))
          .map((pt) => pt.postId),
      );
      filteredPosts = allPosts.filter((p) => postIdsWithTags.has(p.id));
    } else {
      filteredPosts = [];
    }
  }

  const filteredPostIds = filteredPosts.map((post) => post.id);
  const [likeEntriesRaw, commentEntriesRaw] = await Promise.all([
    filteredPostIds.length > 0
      ? db.like.findMany({
          where: { postId: { in: filteredPostIds } },
          select: { postId: true },
        })
      : Promise.resolve([] as Array<{ postId: string }>),
    filteredPostIds.length > 0
      ? db.comment.findMany({
          where: { postId: { in: filteredPostIds } },
          select: { postId: true },
        })
      : Promise.resolve([] as Array<{ postId: string }>),
  ]);
  const likeEntries = likeEntriesRaw as Array<{ postId: string }>;
  const commentEntries = commentEntriesRaw as Array<{ postId: string }>;

  const engagementByPost = new Map<string, number>();
  likeEntries.forEach((entry) => {
    engagementByPost.set(entry.postId, (engagementByPost.get(entry.postId) ?? 0) + 1);
  });
  commentEntries.forEach((entry) => {
    engagementByPost.set(entry.postId, (engagementByPost.get(entry.postId) ?? 0) + 1);
  });

  const rankedPosts = [...filteredPosts].sort((left, right) => {
    const createdDiff = right.createdAt.getTime() - left.createdAt.getTime();
    if (createdDiff !== 0) {
      return createdDiff;
    }

    const engagementDiff =
      (engagementByPost.get(right.id) ?? 0) - (engagementByPost.get(left.id) ?? 0);
    if (engagementDiff !== 0) {
      return engagementDiff;
    }

    return right.id.localeCompare(left.id);
  });

  const decodedCursor = cursor ? decodeCursor(cursor) : null;
  const startIndex = decodedCursor
    ? rankedPosts.findIndex(
        (post) =>
          post.id === decodedCursor.id &&
          post.createdAt.getTime() === decodedCursor.createdAtMs &&
          (engagementByPost.get(post.id) ?? 0) === decodedCursor.engagementScore,
      ) + 1
    : 0;
  const safeStartIndex = Math.max(0, startIndex);

  const pagePosts = rankedPosts.slice(safeStartIndex, safeStartIndex + take);
  const hasMore = rankedPosts.length > safeStartIndex + take;
  const lastPost = pagePosts.at(-1);
  const nextCursor = hasMore && lastPost
    ? encodeCursor({
        id: lastPost.id,
        createdAtMs: lastPost.createdAt.getTime(),
        engagementScore: engagementByPost.get(lastPost.id) ?? 0,
      })
    : null;

  const pagePostIds = pagePosts.map((post) => post.id);
  const pageAuthorIds = [...new Set(pagePosts.map((post) => post.authorId))];
  const likedPostIds = new Set<string>();
  const ratingByPostAndAuthor = new Map<string, number>();

  if (viewerId && pagePostIds.length > 0) {
    const likedPosts = (await db.like.findMany({
      where: {
        userId: viewerId,
        postId: { in: pagePostIds },
      },
      select: { postId: true },
    })) as Array<{ postId: string }>;

    likedPosts.forEach((entry) => likedPostIds.add(entry.postId));
  }

  if (pagePostIds.length > 0) {
    const ratings = (await db.accommodationRating.findMany({
      where: {
        postId: { in: pagePostIds },
        userId: { in: pageAuthorIds },
      },
      select: {
        postId: true,
        userId: true,
        overallScore: true,
      },
    })) as Array<{ postId: string; userId: string; overallScore: number }>;

    ratings.forEach((rating) => {
      ratingByPostAndAuthor.set(`${rating.postId}:${rating.userId}`, rating.overallScore);
    });
  }

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
        accommodationRating: ratingByPostAndAuthor.get(`${post.id}:${post.authorId}`) ?? null,
      };
    }),
  );

  return {
    posts: cards.filter((card): card is PostCardData => card !== null),
    hasMore,
    nextCursor,
  };
}

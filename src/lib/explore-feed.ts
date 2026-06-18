import { db } from "@/lib/db";
import type { PostCardData } from "@/components/post-card";
import type { FilterState } from "@/lib/explore-filters";

export const EXPLORE_PAGE_SIZE = 20;

type ExplorePageResult = {
  posts: PostCardData[];
  hasMore: boolean;
};

export async function getExplorePostsPage(
  viewerId: string | null,
  filters: FilterState,
  offset = 0,
  take = EXPLORE_PAGE_SIZE,
): Promise<ExplorePageResult> {
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

  const pagePosts = filteredPosts.slice(offset, offset + take);
  const hasMore = filteredPosts.length > offset + take;

  const pagePostIds = pagePosts.map((post) => post.id);
  const likedPostIds = new Set<string>();

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

  const cards = await Promise.all(
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
      } satisfies PostCardData;
    }),
  );

  return {
    posts: cards.filter((card): card is PostCardData => card !== null),
    hasMore,
  };
}

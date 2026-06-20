import { db } from "@/lib/db";
import { PREDEFINED_TAGS } from "@/lib/post-constants";
import type { PostCardData } from "@/components/post-card";

const TAG_SET = new Set<string>(PREDEFINED_TAGS);

export function isValidPredefinedTag(tag: string) {
  return TAG_SET.has(tag);
}

export function tagToLabel(tag: string) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type TaggedPost = {
  id: string;
  slug: string;
  title: string;
  locationCity: string;
  locationCountry: string;
  tripType: string;
  authorId: string;
  createdAt: Date;
};

export async function getTagPosts(viewerId: string | null, tag: string): Promise<PostCardData[]> {
  if (!isValidPredefinedTag(tag)) {
    return [];
  }

  const tagRecord = (await db.tag.findUnique({
    where: { name: tag },
    select: { id: true },
  })) as { id: string } | null;

  if (!tagRecord) {
    return [];
  }

  const postTags = (await db.postTag.findMany({
    where: { tagId: tagRecord.id },
    select: { postId: true },
  })) as Array<{ postId: string }>;

  const postIds = postTags.map((entry) => entry.postId);
  if (postIds.length === 0) {
    return [];
  }

  const posts = (await db.experiencePost.findMany({
    where: { id: { in: postIds } },
    orderBy: { createdAt: "desc" },
  })) as TaggedPost[];
  const authorIds = [...new Set(posts.map((post) => post.authorId))];

  const likedPostIds = new Set<string>();
  const ratingByPostAndAuthor = new Map<string, number>();
  if (viewerId) {
    const likedPosts = (await db.like.findMany({
      where: {
        userId: viewerId,
        postId: { in: postIds },
      },
      select: { postId: true },
    })) as Array<{ postId: string }>;
    likedPosts.forEach((entry) => likedPostIds.add(entry.postId));
  }

  if (postIds.length > 0) {
    const ratings = (await db.accommodationRating.findMany({
      where: {
        postId: { in: postIds },
        userId: { in: authorIds },
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
    posts.map(async (post) => {
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

  return cards.filter((card): card is PostCardData => card !== null);
}

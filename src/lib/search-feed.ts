import { db } from "@/lib/db";
import type { PostCardData } from "@/components/post-card";

type SearchPost = {
  id: string;
  slug: string;
  title: string;
  body: string;
  locationCity: string;
  locationCountry: string;
  tripType: string;
  authorId: string;
  createdAt: Date;
};

function scoreField(value: string, phrase: string, terms: string[], weight: number) {
  const normalized = value.toLowerCase();
  let score = 0;

  if (phrase && normalized.includes(phrase)) {
    score += weight * 3;
  }

  for (const term of terms) {
    if (!term) {
      continue;
    }

    if (normalized === term) {
      score += weight * 3;
    } else if (normalized.startsWith(term)) {
      score += weight * 2;
    } else if (normalized.includes(term)) {
      score += weight;
    }
  }

  return score;
}

function computeRelevance(post: SearchPost, query: string) {
  const phrase = query.toLowerCase().trim();
  const terms = phrase.split(/\s+/).filter(Boolean);

  if (!phrase) {
    return 0;
  }

  return (
    scoreField(post.title, phrase, terms, 14) +
    scoreField(post.body, phrase, terms, 6) +
    scoreField(post.locationCity, phrase, terms, 11) +
    scoreField(post.locationCountry, phrase, terms, 10)
  );
}

export async function searchPosts(viewerId: string | null, query: string): Promise<PostCardData[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const posts = (await db.experiencePost.findMany({
    where: { status: "published", visibility: "public" },
    orderBy: { createdAt: "desc" },
  })) as SearchPost[];

  const ranked = posts
    .map((post) => ({
      post,
      relevance: computeRelevance(post, normalizedQuery),
    }))
    .filter((entry) => entry.relevance > 0)
    .sort((left, right) => {
      if (right.relevance !== left.relevance) {
        return right.relevance - left.relevance;
      }

      const dateDiff = right.post.createdAt.getTime() - left.post.createdAt.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return right.post.id.localeCompare(left.post.id);
    });

  const postIds = ranked.map((entry) => entry.post.id);
  const authorIds = [...new Set(ranked.map((entry) => entry.post.authorId))];
  const likedPostIds = new Set<string>();
  const ratingByPostAndAuthor = new Map<string, number>();

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
    ranked.map(async ({ post }) => {
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

import { db } from "@/lib/db";
import type { PostCardData } from "@/components/post-card";
import { locationToSlug } from "@/lib/location-slug";

type BasePost = {
  id: string;
  slug: string;
  title: string;
  locationCity: string;
  locationCountry: string;
  tripType: string;
  authorId: string;
  createdAt: Date;
};

async function getAllLocationPosts() {
  return (await db.experiencePost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      locationCity: true,
      locationCountry: true,
      tripType: true,
      authorId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })) as BasePost[];
}

export async function resolveCountryFromSlug(countrySlug: string) {
  const posts = await getAllLocationPosts();
  const countryMap = new Map<string, string>();

  for (const post of posts) {
    const slug = locationToSlug(post.locationCountry);
    if (!countryMap.has(slug)) {
      countryMap.set(slug, post.locationCountry);
    }
  }

  return countryMap.get(countrySlug) ?? null;
}

export async function resolveCityFromSlug(country: string, citySlug: string) {
  const posts = await getAllLocationPosts();
  const cityMap = new Map<string, string>();

  for (const post of posts) {
    if (post.locationCountry !== country) {
      continue;
    }

    const slug = locationToSlug(post.locationCity);
    if (!cityMap.has(slug)) {
      cityMap.set(slug, post.locationCity);
    }
  }

  return cityMap.get(citySlug) ?? null;
}

export async function getLocationPosts(
  viewerId: string | null,
  country: string,
  city?: string,
): Promise<PostCardData[]> {
  const posts = (await db.experiencePost.findMany({
    where: city
      ? {
          locationCountry: country,
          locationCity: city,
        }
      : {
          locationCountry: country,
        },
    orderBy: { createdAt: "desc" },
  })) as BasePost[];

  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const likedPostIds = new Set<string>();

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
      };
    }),
  );

  return cards.filter((card): card is PostCardData => card !== null);
}

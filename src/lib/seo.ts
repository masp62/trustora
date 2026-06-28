import { db } from "@/lib/db";

export async function getLatestPublicOgImage() {
  const latestPosts = (await db.experiencePost.findMany({
    where: {
      status: "published",
      visibility: "public",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    select: {
      id: true,
    },
  })) as Array<{ id: string }>;

  const latestPost = latestPosts[0] ?? null;

  if (!latestPost) {
    return null;
  }

  const firstImages = (await db.postImage.findMany({
    where: {
      postId: latestPost.id,
    },
    orderBy: {
      order: "asc",
    },
    take: 1,
    select: {
      cloudinaryUrl: true,
    },
  })) as Array<{ cloudinaryUrl: string }>;

  const firstImage = firstImages[0] ?? null;

  return firstImage?.cloudinaryUrl ?? null;
}

export function toOpenGraphImages(imageUrl: string | null, alt: string) {
  if (!imageUrl) {
    return undefined;
  }

  return [
    {
      url: imageUrl,
      alt,
    },
  ];
}
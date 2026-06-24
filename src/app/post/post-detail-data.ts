import { db } from "@/lib/db";

export type PostDetailComment = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

export type PostDetailData = {
  id: string;
  slug: string;
  status: "draft" | "published";
  visibility: "public" | "private";
  publishedAt: Date | null;
  title: string;
  body: string;
  locationCity: string;
  locationCountry: string;
  propertyName: string | null;
  tripType: string;
  authorId: string;
  accommodationId: string;
  accommodation: {
    slug: string;
    name: string;
    weightedOverallScore: number | null;
  };
  createdAt: Date;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  images: Array<{ cloudinaryUrl: string; order: number }>;
  tags: string[];
  likeCount: number;
  comments: PostDetailComment[];
};

export function postCanonicalPath(postId: string, slug: string) {
  return `/post/${postId}/${slug}`;
}

function toAccommodationSlug(name: string | null, city: string, country: string) {
  const source = `${name ?? "accommodation"}-${city}-${country}`;
  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getPostDetailById(id: string, viewerId: string | null = null): Promise<PostDetailData | null> {
  let post:
    | {
        id: string;
        slug: string;
        status: "draft" | "published";
        visibility: "public" | "private";
        publishedAt: Date | null;
        title: string;
        body: string;
        locationCity: string;
        locationCountry: string;
        propertyName: string | null;
        tripType: string;
        authorId: string;
        accommodationId: string | null;
        createdAt: Date;
      }
    | null = null;

  try {
    post = (await db.experiencePost.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        status: true,
        visibility: true,
        publishedAt: true,
        title: true,
        body: true,
        locationCity: true,
        locationCountry: true,
        propertyName: true,
        tripType: true,
        authorId: true,
        accommodationId: true,
        createdAt: true,
      },
    })) as typeof post;
  } catch {
    post = (await db.experiencePost.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        status: true,
        visibility: true,
        publishedAt: true,
        title: true,
        body: true,
        locationCity: true,
        locationCountry: true,
        propertyName: true,
        tripType: true,
        authorId: true,
        createdAt: true,
      },
    })) as (Omit<NonNullable<typeof post>, "accommodationId"> & { accommodationId?: never }) | null;

    if (post) {
      post = { ...post, accommodationId: null };
    }
  }

  if (!post) {
    return null;
  }

  if (post.status === "draft" && post.authorId !== viewerId) {
    return null;
  }

  if (post.visibility === "private" && post.authorId !== viewerId) {
    return null;
  }

  const [author, images, postTags, likeCount] = await Promise.all([
    db.user.findUnique({
      where: { id: post.authorId },
      select: { username: true, displayName: true, avatarUrl: true },
    }) as Promise<{ username: string; displayName: string; avatarUrl: string | null } | null>,
    db.postImage.findMany({
      where: { postId: post.id },
      orderBy: { order: "asc" },
      select: { cloudinaryUrl: true, order: true },
    }) as Promise<Array<{ cloudinaryUrl: string; order: number }>>,
    db.postTag.findMany({
      where: { postId: post.id },
      select: { tagId: true },
    }) as Promise<Array<{ tagId: string }>>,
    db.like.count({ where: { postId: post.id } }),
  ]);

  let accommodation: { slug: string; name: string; weightedOverallScore: number | null } | null = null;
  if (post.accommodationId) {
    try {
      accommodation = (await db.accommodation.findUnique({
        where: { id: post.accommodationId },
        select: {
          slug: true,
          name: true,
          weightedOverallScore: true,
        },
      })) as { slug: string; name: string; weightedOverallScore: number | null } | null;
    } catch {
      accommodation = null;
    }
  }

  let comments: Array<{ id: string; body: string; authorId: string; createdAt: Date }> = [];
  if (post.accommodationId) {
    try {
      comments = (await db.comment.findMany({
        where: { accommodationId: post.accommodationId },
        orderBy: { createdAt: "desc" },
        select: { id: true, body: true, authorId: true, createdAt: true },
      })) as Array<{ id: string; body: string; authorId: string; createdAt: Date }>;
    } catch {
      comments = [];
    }
  }

  if (comments.length === 0) {
    try {
      comments = (await db.comment.findMany({
        where: { postId: post.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, body: true, authorId: true, createdAt: true },
      })) as Array<{ id: string; body: string; authorId: string; createdAt: Date }>;
    } catch {
      comments = [];
    }
  }

  if (!accommodation) {
    accommodation = {
      slug: toAccommodationSlug(post.propertyName, post.locationCity, post.locationCountry),
      name: post.propertyName ?? "Accommodation",
      weightedOverallScore: null,
    };
  }

  if (!author) {
    return null;
  }

  const tagIds = postTags.map((entry) => entry.tagId);
  const commentAuthorIds = [...new Set(comments.map((comment) => comment.authorId))];

  const [tags, commentAuthors] = await Promise.all([
    tagIds.length > 0
      ? ((await db.tag.findMany({
          where: { id: { in: tagIds } },
          select: { name: true },
        })) as Array<{ name: string }>)
      : [],
    commentAuthorIds.length > 0
      ? ((await db.user.findMany({
          where: { id: { in: commentAuthorIds } },
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        })) as Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>)
      : [],
  ]);

  const commentAuthorMap = new Map(commentAuthors.map((entry) => [entry.id, entry]));

  return {
    id: post.id,
    slug: post.slug,
    status: post.status,
    visibility: post.visibility,
    publishedAt: post.publishedAt,
    title: post.title,
    body: post.body,
    locationCity: post.locationCity,
    locationCountry: post.locationCountry,
    propertyName: post.propertyName,
    tripType: post.tripType,
    authorId: post.authorId,
    accommodationId: post.accommodationId ?? `legacy:${post.id}`,
    accommodation,
    createdAt: post.createdAt,
    author,
    images,
    tags: tags.map((tag) => tag.name).sort((left, right) => left.localeCompare(right)),
    likeCount,
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: commentAuthorMap.get(comment.authorId) ?? null,
    })),
  };
}

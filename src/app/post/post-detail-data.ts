import { cache } from "react";

import { db } from "@/lib/db";

export type PostDetailComment = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

export type PostDetailData = {
  id: string;
  slug: string;
  title: string;
  body: string;
  locationCity: string;
  locationCountry: string;
  propertyName: string | null;
  tripType: string;
  authorId: string;
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

export const getPostDetailById = cache(async (id: string): Promise<PostDetailData | null> => {
  const post = (await db.experiencePost.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      locationCity: true,
      locationCountry: true,
      propertyName: true,
      tripType: true,
      authorId: true,
      createdAt: true,
    },
  })) as
    | {
        id: string;
        slug: string;
        title: string;
        body: string;
        locationCity: string;
        locationCountry: string;
        propertyName: string | null;
        tripType: string;
        authorId: string;
        createdAt: Date;
      }
    | null;

  if (!post) {
    return null;
  }

  const [author, images, postTags, likeCount, comments] = await Promise.all([
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
    db.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, authorId: true, createdAt: true },
    }) as Promise<Array<{ id: string; body: string; authorId: string; createdAt: Date }>>,
  ]);

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
    title: post.title,
    body: post.body,
    locationCity: post.locationCity,
    locationCountry: post.locationCountry,
    propertyName: post.propertyName,
    tripType: post.tripType,
    authorId: post.authorId,
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
});

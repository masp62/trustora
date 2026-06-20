"use server";

import { TripType } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { type PostActionFieldErrors, type PostActionState } from "@/lib/post-action-state";
import {
  MAX_PHOTOS_PER_POST,
  MAX_POSTS_PER_24H,
  MAX_TAGS_PER_POST,
  MIN_PHOTOS_PER_POST,
  POST_BODY_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  PREDEFINED_TAGS,
  PROPERTY_NAME_MAX_LENGTH,
  TRIP_TYPES,
} from "@/lib/post-constants";

function parseField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "experience";
}

async function generateUniquePostSlug(title: string) {
  const base = normalizeSlug(title).slice(0, 64);
  const posts = (await db.experiencePost.findMany({
    select: { slug: true },
  })) as { slug: string }[];

  const existingSlugs = new Set(posts.map((post) => post.slug));
  if (!existingSlugs.has(base)) {
    return base;
  }

  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`.slice(0, 72);
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`.slice(0, 80);
}

export async function createExperiencePost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = (await db.user.findUnique({
    where: { id: session.user.id },
    select: { isBanned: true },
  })) as { isBanned: boolean } | null;

  if (currentUser?.isBanned) {
    return {
      error: "Your account is banned. You cannot create posts or comments.",
      fieldErrors: {},
    };
  }

  const title = parseField(formData.get("title"));
  const body = parseField(formData.get("body"));
  const locationCity = parseField(formData.get("locationCity"));
  const locationCountry = parseField(formData.get("locationCountry"));
  const propertyName = parseField(formData.get("propertyName"));
  const tripTypeValue = parseField(formData.get("tripType"));

  const selectedTags = formData
    .getAll("tags")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueTags = [...new Set(selectedTags)];

  const photoUrls = formData
    .getAll("photoUrls")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  const fieldErrors: PostActionFieldErrors = {};

  if (!title) {
    fieldErrors.title = "Title is required.";
  } else if (title.length > POST_TITLE_MAX_LENGTH) {
    fieldErrors.title = `Title must be ${POST_TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (!body) {
    fieldErrors.body = "Body is required.";
  } else if (body.length > POST_BODY_MAX_LENGTH) {
    fieldErrors.body = `Body must be ${POST_BODY_MAX_LENGTH} characters or fewer.`;
  }

  if (!locationCity || !locationCountry) {
    fieldErrors.location = "City and country are required.";
  }

  if (propertyName.length > PROPERTY_NAME_MAX_LENGTH) {
    fieldErrors.location = `Property name must be ${PROPERTY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!TRIP_TYPES.includes(tripTypeValue as (typeof TRIP_TYPES)[number])) {
    fieldErrors.tripType = "Trip type is required.";
  }

  if (uniqueTags.length > MAX_TAGS_PER_POST) {
    fieldErrors.tags = `Select up to ${MAX_TAGS_PER_POST} tags.`;
  }

  const hasInvalidTag = uniqueTags.some(
    (tag) => !PREDEFINED_TAGS.includes(tag as (typeof PREDEFINED_TAGS)[number]),
  );
  if (hasInvalidTag) {
    fieldErrors.tags = "One or more selected tags are invalid.";
  }

  if (photoUrls.length < MIN_PHOTOS_PER_POST) {
    fieldErrors.photos = "Upload at least one photo.";
  } else if (photoUrls.length > MAX_PHOTOS_PER_POST) {
    fieldErrors.photos = `Upload up to ${MAX_PHOTOS_PER_POST} photos.`;
  }

  const hasInvalidPhotoUrl = photoUrls.some((url) => !url.startsWith("/uploads/"));
  if (hasInvalidPhotoUrl) {
    fieldErrors.photos = "Uploaded photo URLs are invalid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existingPosts = (await db.experiencePost.findMany({
    where: { authorId: session.user.id },
    select: { createdAt: true },
  })) as { createdAt: Date }[];

  const postsInWindow = existingPosts.filter((post) => new Date(post.createdAt) >= cutoff).length;
  if (postsInWindow >= MAX_POSTS_PER_24H) {
    return {
      error: "Rate limit reached: you can create up to 5 posts in 24 hours.",
      fieldErrors: {},
    };
  }

  const slug = await generateUniquePostSlug(title);

  const createdPost = await db.experiencePost.create({
    data: {
      slug,
      title,
      body,
      locationCity,
      locationCountry,
      propertyName: propertyName || null,
      tripType: tripTypeValue as TripType,
      authorId: session.user.id,
    },
  });

  await Promise.all(
    photoUrls.map((url, index) =>
      db.postImage.create({
        data: {
          postId: createdPost.id,
          cloudinaryUrl: url,
          order: index,
        },
      }),
    ),
  );

  if (uniqueTags.length > 0) {
    const tags = await Promise.all(
      uniqueTags.map((tagName) =>
        db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        }),
      ),
    );

    await db.postTag.createMany({
      data: tags.map((tag) => ({
        postId: createdPost.id,
        tagId: tag.id,
      })),
    });
  }

  redirect(`/post/${createdPost.id}/${createdPost.slug}`);
}

export async function updateExperiencePost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const postId = parseField(formData.get("postId"));
  if (!postId) {
    return { error: "Post not found.", fieldErrors: {} };
  }

  const existingPost = (await db.experiencePost.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  })) as { id: string; authorId: string } | null;

  if (!existingPost) {
    return { error: "Post not found.", fieldErrors: {} };
  }

  if (existingPost.authorId !== session.user.id) {
    return { error: "You are not authorized to edit this post.", fieldErrors: {} };
  }

  const title = parseField(formData.get("title"));
  const body = parseField(formData.get("body"));
  const locationCity = parseField(formData.get("locationCity"));
  const locationCountry = parseField(formData.get("locationCountry"));
  const propertyName = parseField(formData.get("propertyName"));
  const tripTypeValue = parseField(formData.get("tripType"));

  const selectedTags = formData
    .getAll("tags")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueTags = [...new Set(selectedTags)];

  const photoUrls = formData
    .getAll("photoUrls")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  const fieldErrors: PostActionFieldErrors = {};

  if (!title) {
    fieldErrors.title = "Title is required.";
  } else if (title.length > POST_TITLE_MAX_LENGTH) {
    fieldErrors.title = `Title must be ${POST_TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (!body) {
    fieldErrors.body = "Body is required.";
  } else if (body.length > POST_BODY_MAX_LENGTH) {
    fieldErrors.body = `Body must be ${POST_BODY_MAX_LENGTH} characters or fewer.`;
  }

  if (!locationCity || !locationCountry) {
    fieldErrors.location = "City and country are required.";
  }

  if (propertyName.length > PROPERTY_NAME_MAX_LENGTH) {
    fieldErrors.location = `Property name must be ${PROPERTY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!TRIP_TYPES.includes(tripTypeValue as (typeof TRIP_TYPES)[number])) {
    fieldErrors.tripType = "Trip type is required.";
  }

  if (uniqueTags.length > MAX_TAGS_PER_POST) {
    fieldErrors.tags = `Select up to ${MAX_TAGS_PER_POST} tags.`;
  }

  const hasInvalidTag = uniqueTags.some(
    (tag) => !PREDEFINED_TAGS.includes(tag as (typeof PREDEFINED_TAGS)[number]),
  );
  if (hasInvalidTag) {
    fieldErrors.tags = "One or more selected tags are invalid.";
  }

  if (photoUrls.length < MIN_PHOTOS_PER_POST) {
    fieldErrors.photos = "Upload at least one photo.";
  } else if (photoUrls.length > MAX_PHOTOS_PER_POST) {
    fieldErrors.photos = `Upload up to ${MAX_PHOTOS_PER_POST} photos.`;
  }

  const hasInvalidPhotoUrl = photoUrls.some((url) => !url.startsWith("/uploads/"));
  if (hasInvalidPhotoUrl) {
    fieldErrors.photos = "Uploaded photo URLs are invalid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const slug = await generateUniquePostSlug(title);

  await db.experiencePost.update({
    where: { id: postId },
    data: {
      slug,
      title,
      body,
      locationCity,
      locationCountry,
      propertyName: propertyName || null,
      tripType: tripTypeValue as TripType,
    },
  });

  // Replace images
  await db.postImage.deleteMany({ where: { postId } });
  await Promise.all(
    photoUrls.map((url, index) =>
      db.postImage.create({
        data: {
          postId,
          cloudinaryUrl: url,
          order: index,
        },
      }),
    ),
  );

  // Replace tags
  await db.postTag.deleteMany({ where: { postId } });
  if (uniqueTags.length > 0) {
    const tags = await Promise.all(
      uniqueTags.map((tagName) =>
        db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        }),
      ),
    );

    await db.postTag.createMany({
      data: tags.map((tag) => ({
        postId,
        tagId: tag.id,
      })),
    });
  }

  redirect(`/post/${postId}/${slug}`);
}

export async function deleteExperiencePost(postId: string): Promise<{ error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const existingPost = (await db.experiencePost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  })) as { authorId: string } | null;

  if (!existingPost) {
    return { error: "Post not found." };
  }

  if (existingPost.authorId !== session.user.id) {
    return { error: "You are not authorized to delete this post." };
  }

  await db.experiencePost.delete({ where: { id: postId } });

  const username = (
    (await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    })) as { username: string } | null
  )?.username;

  redirect(username ? `/u/${username}` : "/explore");
}

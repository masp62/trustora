"use server";

import { revalidatePath } from "next/cache";
import type { TripType } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { postCanonicalPath } from "@/app/post/post-detail-data";
import { ensureAccommodationForPostInput, recomputeAccommodationAggregate } from "@/lib/accommodations";
import { db } from "@/lib/db";
import { locationToSlug } from "@/lib/location-slug";
import { type PostActionState } from "@/lib/post-action-state";
import { validatePostInput, firstValidationError } from "@/lib/post-validation";
import { MAX_POSTS_PER_24H } from "@/lib/post-constants";

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

function parseCategoryRating(formData: FormData, key: string) {
  const raw = parseField(formData.get(key));
  return Number(raw);
}

type SubmissionIntent = "draft" | "publish";

function parseSubmissionIntent(formData: FormData): SubmissionIntent {
  const intent = parseField(formData.get("intent"));
  return intent === "draft" ? "draft" : "publish";
}

function computeOverallAccommodationRating(categoryRatings: {
  cleanliness: number;
  accuracy: number;
  checkIn: number;
  communication: number;
  location: number;
  value: number;
  comfort: number;
  facilities: number;
}) {
  const values = [
    categoryRatings.cleanliness,
    categoryRatings.accuracy,
    categoryRatings.checkIn,
    categoryRatings.communication,
    categoryRatings.location,
    categoryRatings.value,
    categoryRatings.comfort,
    categoryRatings.facilities,
  ];

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number(average.toFixed(1));
}

function supportsAccommodationSchema() {
  return typeof (db as unknown as { accommodation?: { findMany?: unknown } }).accommodation?.findMany === "function";
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

async function validateDraftForPublishing(postId: string, authorId: string): Promise<string | null> {
  const [post, postImages, postTagEntries, rating] = await Promise.all([
    db.experiencePost.findUnique({
      where: { id: postId },
      select: {
        title: true,
        body: true,
        locationCity: true,
        locationCountry: true,
        propertyName: true,
        tripType: true,
      },
    }) as Promise<{
      title: string;
      body: string;
      locationCity: string;
      locationCountry: string;
      propertyName: string | null;
      tripType: string;
    } | null>,
    db.postImage.findMany({
      where: { postId },
      select: { cloudinaryUrl: true },
    }) as Promise<Array<{ cloudinaryUrl: string }>>,
    db.postTag.findMany({
      where: { postId },
      select: { tagId: true },
    }) as Promise<Array<{ tagId: string }>>,
    db.accommodationRating.findMany({
      where: { postId, userId: authorId },
      take: 1,
      select: {
        cleanliness: true,
        accuracy: true,
        checkIn: true,
        communication: true,
        location: true,
        value: true,
        comfort: true,
        facilities: true,
      },
    }) as Promise<
      Array<{
        cleanliness: number;
        accuracy: number;
        checkIn: number;
        communication: number;
        location: number;
        value: number;
        comfort: number;
        facilities: number;
      }>
    >,
  ]);

  if (!post) {
    return "Post not found.";
  }

  const postTags =
    postTagEntries.length > 0
      ? ((await db.tag.findMany({
          where: { id: { in: postTagEntries.map((entry) => entry.tagId) } },
          select: { name: true },
        })) as Array<{ name: string }>)
      : [];

  const ratingRecord = rating[0];
  const categoryRatings = ratingRecord
    ? {
        cleanliness: ratingRecord.cleanliness,
        accuracy: ratingRecord.accuracy,
        checkIn: ratingRecord.checkIn,
        communication: ratingRecord.communication,
        location: ratingRecord.location,
        value: ratingRecord.value,
        comfort: ratingRecord.comfort,
        facilities: ratingRecord.facilities,
      }
    : { cleanliness: 0, accuracy: 0, checkIn: 0, communication: 0, location: 0, value: 0, comfort: 0, facilities: 0 };

  const result = validatePostInput(
    {
      title: post.title,
      body: post.body,
      locationCity: post.locationCity,
      locationCountry: post.locationCountry,
      propertyName: post.propertyName ?? "",
      tripType: post.tripType,
      categoryRatings,
      tags: postTags.map((t) => t.name),
      photoUrls: postImages.map((img) => img.cloudinaryUrl),
    },
    "publish",
  );

  return firstValidationError(result);
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
  const intent = parseSubmissionIntent(formData);
  const categoryRatings = {
    cleanliness: parseCategoryRating(formData, "cleanliness"),
    accuracy: parseCategoryRating(formData, "accuracy"),
    checkIn: parseCategoryRating(formData, "checkIn"),
    communication: parseCategoryRating(formData, "communication"),
    location: parseCategoryRating(formData, "location"),
    value: parseCategoryRating(formData, "value"),
    comfort: parseCategoryRating(formData, "comfort"),
    facilities: parseCategoryRating(formData, "facilities"),
  };

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

  const { valid, fieldErrors } = validatePostInput(
    { title, body, locationCity, locationCountry, propertyName, tripType: tripTypeValue, categoryRatings, tags: uniqueTags, photoUrls },
    intent,
  );

  if (!valid) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  if (!propertyName) {
    return {
      error: "Property name is required.",
      fieldErrors: {
        ...fieldErrors,
        location: "Property name is required to link this story to an accommodation.",
      },
    };
  }

  const accommodationRating = computeOverallAccommodationRating(categoryRatings);

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
  const accommodation = await ensureAccommodationForPostInput({
    propertyName,
    locationCity,
    locationCountry,
  });

  const createdPost = await db.experiencePost.create({
    data: {
      slug,
      status: intent === "draft" ? "draft" : "published",
      visibility: "public",
      visibilityChangedAt: null,
      publishedAt: intent === "draft" ? null : new Date(),
      title,
      body,
      locationCity,
      locationCountry,
      propertyName: propertyName || null,
      tripType: tripTypeValue as TripType,
      ...(supportsAccommodationSchema() && accommodation?.id ? { accommodationId: accommodation.id } : {}),
      authorId: session.user.id,
    },
  }) as { id: string; slug: string };

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

  await db.accommodationRating.create({
    data: {
      postId: createdPost.id,
      userId: session.user.id,
      overallScore: accommodationRating,
      cleanliness: categoryRatings.cleanliness,
      accuracy: categoryRatings.accuracy,
      checkIn: categoryRatings.checkIn,
      communication: categoryRatings.communication,
      location: categoryRatings.location,
      value: categoryRatings.value,
      comfort: categoryRatings.comfort,
      facilities: categoryRatings.facilities,
      wouldStayAgain: true,
      reviewText: null,
      isVerifiedStay: false,
    },
  });

  if (accommodation?.id) {
    await recomputeAccommodationAggregate(accommodation.id);
  }

  redirect(`/post/${createdPost.id}`);
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
    select: { id: true, authorId: true, status: true, publishedAt: true, accommodationId: true },
  })) as {
    id: string;
    authorId: string;
    status: "draft" | "published";
    publishedAt: Date | null;
    accommodationId: string;
  } | null;

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
  const intent = parseSubmissionIntent(formData);
  const categoryRatings = {
    cleanliness: parseCategoryRating(formData, "cleanliness"),
    accuracy: parseCategoryRating(formData, "accuracy"),
    checkIn: parseCategoryRating(formData, "checkIn"),
    communication: parseCategoryRating(formData, "communication"),
    location: parseCategoryRating(formData, "location"),
    value: parseCategoryRating(formData, "value"),
    comfort: parseCategoryRating(formData, "comfort"),
    facilities: parseCategoryRating(formData, "facilities"),
  };

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

  const { valid, fieldErrors } = validatePostInput(
    { title, body, locationCity, locationCountry, propertyName, tripType: tripTypeValue, categoryRatings, tags: uniqueTags, photoUrls },
    intent,
  );

  if (!valid) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  if (!propertyName) {
    return {
      error: "Property name is required.",
      fieldErrors: {
        ...fieldErrors,
        location: "Property name is required to link this story to an accommodation.",
      },
    };
  }

  const accommodationRating = computeOverallAccommodationRating(categoryRatings);

  const slug = await generateUniquePostSlug(title);
  const accommodation = await ensureAccommodationForPostInput({
    propertyName,
    locationCity,
    locationCountry,
  });
  const nextStatus =
    existingPost.status === "published" ? "published" : intent === "draft" ? "draft" : "published";
  const nextPublishedAt =
    nextStatus === "published"
      ? existingPost.publishedAt ?? new Date()
      : null;

  await db.experiencePost.update({
    where: { id: postId },
    data: {
      slug,
      status: nextStatus,
      publishedAt: nextPublishedAt,
      title,
      body,
      locationCity,
      locationCountry,
      propertyName: propertyName || null,
      tripType: tripTypeValue as TripType,
      ...(supportsAccommodationSchema() && accommodation?.id ? { accommodationId: accommodation.id } : {}),
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

  const existingRating = (await db.accommodationRating.findMany({
    where: { postId, userId: session.user.id },
    take: 1,
    select: { id: true },
  })) as Array<{ id: string }>;

  if (existingRating.length > 0) {
    await db.accommodationRating.update({
      where: { id: existingRating[0].id },
      data: {
        overallScore: accommodationRating,
        cleanliness: categoryRatings.cleanliness,
        accuracy: categoryRatings.accuracy,
        checkIn: categoryRatings.checkIn,
        communication: categoryRatings.communication,
        location: categoryRatings.location,
        value: categoryRatings.value,
        comfort: categoryRatings.comfort,
        facilities: categoryRatings.facilities,
      },
    });
  } else {
    await db.accommodationRating.create({
      data: {
        postId,
        userId: session.user.id,
        overallScore: accommodationRating,
        cleanliness: categoryRatings.cleanliness,
        accuracy: categoryRatings.accuracy,
        checkIn: categoryRatings.checkIn,
        communication: categoryRatings.communication,
        location: categoryRatings.location,
        value: categoryRatings.value,
        comfort: categoryRatings.comfort,
        facilities: categoryRatings.facilities,
        wouldStayAgain: true,
        reviewText: null,
        isVerifiedStay: false,
      },
    });
  }

  const aggregateRecomputes: Array<Promise<unknown>> = [];
  if (accommodation?.id) {
    aggregateRecomputes.push(recomputeAccommodationAggregate(accommodation.id));
  }
  if (existingPost.accommodationId && accommodation?.id && existingPost.accommodationId !== accommodation.id) {
    aggregateRecomputes.push(recomputeAccommodationAggregate(existingPost.accommodationId));
  }
  if (aggregateRecomputes.length > 0) {
    await Promise.all(aggregateRecomputes);
  }

  redirect(`/post/${postId}`);
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

export async function publishDraftExperiencePost(postId: string): Promise<{ error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const existingPost = (await db.experiencePost.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, slug: true, status: true },
  })) as { id: string; authorId: string; slug: string; status: "draft" | "published" } | null;

  if (!existingPost) {
    return { error: "Post not found." };
  }

  if (existingPost.authorId !== session.user.id) {
    return { error: "You are not authorized to publish this post." };
  }

  if (existingPost.status === "published") {
    redirect(`/post/${existingPost.id}`);
  }

  const validationError = await validateDraftForPublishing(existingPost.id, existingPost.authorId);
  if (validationError) {
    return { error: validationError };
  }

  const updated = await db.experiencePost.update({
    where: { id: existingPost.id },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
    select: {
      id: true,
      slug: true,
    },
  });

  redirect(`/post/${updated.id}`);
}

export async function setPostVisibility(
  postId: string,
  visibility: "public" | "private",
): Promise<{ error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const existingPost = (await db.experiencePost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      status: true,
      visibility: true,
      authorId: true,
      locationCountry: true,
      locationCity: true,
    },
  })) as {
    id: string;
    slug: string;
    status: "draft" | "published";
    visibility: "public" | "private";
    authorId: string;
    locationCountry: string;
    locationCity: string;
  } | null;

  if (!existingPost) {
    return { error: "Post not found." };
  }

  if (existingPost.authorId !== session.user.id) {
    return { error: "You are not authorized to update visibility for this post." };
  }

  if (existingPost.status !== "published") {
    return { error: "Only published posts can change visibility." };
  }

  if (existingPost.visibility === visibility) {
    return {};
  }

  await db.experiencePost.update({
    where: { id: existingPost.id },
    data: {
      visibility,
      visibilityChangedAt: new Date(),
    },
  });

  const [author, postTags] = await Promise.all([
    db.user.findUnique({
      where: { id: existingPost.authorId },
      select: { username: true },
    }) as Promise<{ username: string } | null>,
    db.postTag.findMany({
      where: { postId: existingPost.id },
      select: { tagId: true },
    }) as Promise<Array<{ tagId: string }>>,
  ]);

  const tagIds = postTags.map((entry) => entry.tagId);
  const tags =
    tagIds.length > 0
      ? ((await db.tag.findMany({
          where: { id: { in: tagIds } },
          select: { name: true },
        })) as Array<{ name: string }>)
      : [];

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/search");
  revalidatePath(`/post/${existingPost.id}`);
  revalidatePath(postCanonicalPath(existingPost.id, existingPost.slug));
  const countrySlug = locationToSlug(existingPost.locationCountry);
  const citySlug = locationToSlug(existingPost.locationCity);
  revalidatePath(`/explore/${countrySlug}`);
  revalidatePath(`/explore/${countrySlug}/${citySlug}`);

  tags.forEach((tag) => {
    revalidatePath(`/explore/tags/${tag.name}`);
  });

  if (author?.username) {
    revalidatePath(`/u/${author.username}`);
  }

  redirect(postCanonicalPath(existingPost.id, existingPost.slug));
}

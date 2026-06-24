import { db } from "@/lib/db";

export type AccommodationAggregate = {
  weightedOverallScore: number | null;
  weightedCleanliness: number | null;
  weightedAccuracy: number | null;
  weightedCheckIn: number | null;
  weightedCommunication: number | null;
  weightedLocation: number | null;
  weightedValue: number | null;
  weightedComfort: number | null;
  weightedFacilities: number | null;
  contributingRatingCount: number;
};

export type AccommodationCardData = {
  id: string;
  slug: string;
  name: string;
  locationCity: string;
  locationCountry: string;
  experienceCount: number;
  weightedOverallScore: number | null;
  leadImageUrl: string | null;
};

export type AccommodationPostCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  locationCity: string;
  locationCountry: string;
  tripType: string;
  createdAt: Date;
  leadImageUrl: string | null;
  individualRating: number | null;
};

export type AccommodationCommentData = {
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

function normalizePart(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function hasAccommodationModel() {
  return typeof (db as unknown as { accommodation?: { findMany?: unknown } }).accommodation?.findMany === "function";
}

async function generateAccommodationSlug(name: string, city: string, country: string) {
  const base = slugify(`${name}-${city}-${country}`) || "accommodation";
  const existing = (await db.accommodation.findMany({
    select: { slug: true },
  })) as Array<{ slug: string }>;

  const existingSet = new Set(existing.map((entry) => entry.slug));
  if (!existingSet.has(base)) {
    return base;
  }

  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`.slice(0, 110);
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`.slice(0, 120);
}

export async function ensureAccommodationForPostInput(input: {
  propertyName: string;
  locationCity: string;
  locationCountry: string;
}) {
  if (!hasAccommodationModel()) {
    return null;
  }

  const name = input.propertyName.trim();
  const locationCity = input.locationCity.trim();
  const locationCountry = input.locationCountry.trim();

  if (!name || !locationCity || !locationCountry) {
    throw new Error("Property name, city and country are required to link this story.");
  }

  try {
    const all = (await db.accommodation.findMany({
      select: {
        id: true,
        name: true,
        locationCity: true,
        locationCountry: true,
        slug: true,
      },
    })) as Array<{
      id: string;
      name: string;
      locationCity: string;
      locationCountry: string;
      slug: string;
    }>;

    const existing = all.find(
      (entry) =>
        normalizePart(entry.name) === normalizePart(name) &&
        normalizePart(entry.locationCity) === normalizePart(locationCity) &&
        normalizePart(entry.locationCountry) === normalizePart(locationCountry),
    );

    if (existing) {
      return existing;
    }

    const slug = await generateAccommodationSlug(name, locationCity, locationCountry);

    return (await db.accommodation.create({
      data: {
        name,
        locationCity,
        locationCountry,
        slug,
      },
      select: {
        id: true,
        name: true,
        locationCity: true,
        locationCountry: true,
        slug: true,
      },
    })) as {
      id: string;
      name: string;
      locationCity: string;
      locationCountry: string;
      slug: string;
    };
  } catch {
    return null;
  }
}

function ageWeight(createdAt: Date, now = new Date()) {
  const ageDays = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);

  if (ageDays <= 30) {
    return 1;
  }
  if (ageDays <= 180) {
    return 0.75;
  }
  if (ageDays <= 270) {
    return 0.5;
  }
  if (ageDays <= 365) {
    return 0.25;
  }
  return 0;
}

function weightedAverage(values: Array<{ value: number; weight: number }>) {
  const weightedSum = values.reduce((sum, entry) => sum + entry.value * entry.weight, 0);
  const weightSum = values.reduce((sum, entry) => sum + entry.weight, 0);
  if (weightSum <= 0) {
    return null;
  }

  return Number((weightedSum / weightSum).toFixed(2));
}

export async function recomputeAccommodationAggregate(accommodationId: string): Promise<AccommodationAggregate> {
  if (!hasAccommodationModel()) {
    return {
      weightedOverallScore: null,
      weightedCleanliness: null,
      weightedAccuracy: null,
      weightedCheckIn: null,
      weightedCommunication: null,
      weightedLocation: null,
      weightedValue: null,
      weightedComfort: null,
      weightedFacilities: null,
      contributingRatingCount: 0,
    };
  }

  const posts = (await db.experiencePost.findMany({
    where: { accommodationId },
    select: { id: true },
  })) as Array<{ id: string }>;

  if (posts.length === 0) {
    const empty: AccommodationAggregate = {
      weightedOverallScore: null,
      weightedCleanliness: null,
      weightedAccuracy: null,
      weightedCheckIn: null,
      weightedCommunication: null,
      weightedLocation: null,
      weightedValue: null,
      weightedComfort: null,
      weightedFacilities: null,
      contributingRatingCount: 0,
    };

    await db.accommodation.update({
      where: { id: accommodationId },
      data: {
        ...empty,
        aggregateUpdatedAt: new Date(),
      },
    });

    return empty;
  }

  const postIds = posts.map((post) => post.id);
  const ratings = (await db.accommodationRating.findMany({
    where: { postId: { in: postIds } },
    select: {
      overallScore: true,
      cleanliness: true,
      accuracy: true,
      checkIn: true,
      communication: true,
      location: true,
      value: true,
      comfort: true,
      facilities: true,
      createdAt: true,
    },
  })) as Array<{
    overallScore: number;
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
    comfort: number;
    facilities: number;
    createdAt: Date;
  }>;

  const weighted = ratings
    .map((rating) => ({ rating, weight: ageWeight(rating.createdAt) }))
    .filter((entry) => entry.weight > 0);

  const aggregate: AccommodationAggregate = {
    weightedOverallScore: weightedAverage(weighted.map((entry) => ({ value: entry.rating.overallScore, weight: entry.weight }))),
    weightedCleanliness: weightedAverage(weighted.map((entry) => ({ value: entry.rating.cleanliness, weight: entry.weight }))),
    weightedAccuracy: weightedAverage(weighted.map((entry) => ({ value: entry.rating.accuracy, weight: entry.weight }))),
    weightedCheckIn: weightedAverage(weighted.map((entry) => ({ value: entry.rating.checkIn, weight: entry.weight }))),
    weightedCommunication: weightedAverage(weighted.map((entry) => ({ value: entry.rating.communication, weight: entry.weight }))),
    weightedLocation: weightedAverage(weighted.map((entry) => ({ value: entry.rating.location, weight: entry.weight }))),
    weightedValue: weightedAverage(weighted.map((entry) => ({ value: entry.rating.value, weight: entry.weight }))),
    weightedComfort: weightedAverage(weighted.map((entry) => ({ value: entry.rating.comfort, weight: entry.weight }))),
    weightedFacilities: weightedAverage(weighted.map((entry) => ({ value: entry.rating.facilities, weight: entry.weight }))),
    contributingRatingCount: weighted.length,
  };

  await db.accommodation.update({
    where: { id: accommodationId },
    data: {
      ...aggregate,
      aggregateUpdatedAt: new Date(),
    },
  });

  return aggregate;
}

export async function getAccommodationCards(): Promise<AccommodationCardData[]> {
  if (!hasAccommodationModel()) {
    const posts = (await db.experiencePost.findMany({
      where: { status: "published", visibility: "public" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        propertyName: true,
        locationCity: true,
        locationCountry: true,
        authorId: true,
      },
    })) as Array<{
      id: string;
      slug: string;
      propertyName: string | null;
      locationCity: string;
      locationCountry: string;
      authorId: string;
    }>;

    const grouped = new Map<string, AccommodationCardData>();
    for (const post of posts) {
      if (!post.propertyName) {
        continue;
      }

      const key = `${normalizePart(post.propertyName)}|${normalizePart(post.locationCity)}|${normalizePart(post.locationCountry)}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.experienceCount += 1;
        continue;
      }

      const ratings = (await db.accommodationRating.findMany({
        where: { postId: post.id, userId: post.authorId },
        take: 1,
        select: { overallScore: true },
      })) as Array<{ overallScore: number }>;
      const leadImage = (await db.postImage.findMany({
        where: { postId: post.id },
        orderBy: { order: "asc" },
        take: 1,
        select: { cloudinaryUrl: true },
      })) as Array<{ cloudinaryUrl: string }>;

      grouped.set(key, {
        id: key,
        slug: slugify(`${post.propertyName}-${post.locationCity}-${post.locationCountry}`),
        name: post.propertyName,
        locationCity: post.locationCity,
        locationCountry: post.locationCountry,
        experienceCount: 1,
        weightedOverallScore: ratings[0]?.overallScore ?? null,
        leadImageUrl: leadImage[0]?.cloudinaryUrl ?? null,
      });
    }

    return [...grouped.values()];
  }

  const accommodations = (await db.accommodation.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      locationCity: true,
      locationCountry: true,
      weightedOverallScore: true,
    },
  })) as Array<{
    id: string;
    slug: string;
    name: string;
    locationCity: string;
    locationCountry: string;
    weightedOverallScore: number | null;
  }>;

  const result = await Promise.all(
    accommodations.map(async (accommodation) => {
      const posts = (await db.experiencePost.findMany({
        where: {
          accommodationId: accommodation.id,
          status: "published",
          visibility: "public",
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })) as Array<{ id: string }>;

      const firstPostId = posts[0]?.id;
      const image = firstPostId
        ? ((await db.postImage.findMany({
            where: { postId: firstPostId },
            orderBy: { order: "asc" },
            take: 1,
            select: { cloudinaryUrl: true },
          })) as Array<{ cloudinaryUrl: string }>)[0]?.cloudinaryUrl ?? null
        : null;

      return {
        id: accommodation.id,
        slug: accommodation.slug,
        name: accommodation.name,
        locationCity: accommodation.locationCity,
        locationCountry: accommodation.locationCountry,
        weightedOverallScore: accommodation.weightedOverallScore,
        experienceCount: posts.length,
        leadImageUrl: image,
      };
    }),
  );

  return result.filter((entry) => entry.experienceCount > 0);
}

export async function getAccommodationDetailBySlug(slug: string) {
  if (!hasAccommodationModel()) {
    const posts = (await db.experiencePost.findMany({
      where: { status: "published", visibility: "public" },
      orderBy: { createdAt: "desc" },
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
    })) as Array<{
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
    }>;

    const matching = posts.filter(
      (post) =>
        post.propertyName && slugify(`${post.propertyName}-${post.locationCity}-${post.locationCountry}`) === slug,
    );

    if (matching.length === 0) {
      return null;
    }

    const first = matching[0];
    const cards = await Promise.all(
      matching.map(async (post) => {
        const image = (await db.postImage.findMany({
          where: { postId: post.id },
          orderBy: { order: "asc" },
          take: 1,
          select: { cloudinaryUrl: true },
        })) as Array<{ cloudinaryUrl: string }>;
        const ratings = (await db.accommodationRating.findMany({
          where: { postId: post.id, userId: post.authorId },
          take: 1,
          select: { overallScore: true },
        })) as Array<{ overallScore: number }>;

        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.body.slice(0, 190),
          locationCity: post.locationCity,
          locationCountry: post.locationCountry,
          tripType: post.tripType,
          createdAt: post.createdAt,
          leadImageUrl: image[0]?.cloudinaryUrl ?? null,
          individualRating: ratings[0]?.overallScore ?? null,
        } satisfies AccommodationPostCardData;
      }),
    );

    const comments = (await db.comment.findMany({
      where: { postId: first.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        authorId: true,
        createdAt: true,
      },
    })) as Array<{ id: string; body: string; authorId: string; createdAt: Date }>;

    const authorIds = [...new Set(comments.map((comment) => comment.authorId))];
    const authors =
      authorIds.length > 0
        ? ((await db.user.findMany({
            where: { id: { in: authorIds } },
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          })) as Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>)
        : [];
    const authorMap = new Map(authors.map((entry) => [entry.id, entry]));

    return {
      id: slug,
      slug,
      name: first.propertyName ?? "Accommodation",
      locationCity: first.locationCity,
      locationCountry: first.locationCountry,
      weightedOverallScore: null,
      weightedCleanliness: null,
      weightedAccuracy: null,
      weightedCheckIn: null,
      weightedCommunication: null,
      weightedLocation: null,
      weightedValue: null,
      weightedComfort: null,
      weightedFacilities: null,
      contributingRatingCount: 0,
      anchorPostId: first.id,
      posts: cards,
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: authorMap.get(comment.authorId) ?? null,
      })),
    };
  }

  const accommodation = (await db.accommodation.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      locationCity: true,
      locationCountry: true,
      weightedOverallScore: true,
      weightedCleanliness: true,
      weightedAccuracy: true,
      weightedCheckIn: true,
      weightedCommunication: true,
      weightedLocation: true,
      weightedValue: true,
      weightedComfort: true,
      weightedFacilities: true,
      contributingRatingCount: true,
    },
  })) as {
    id: string;
    slug: string;
    name: string;
    locationCity: string;
    locationCountry: string;
    weightedOverallScore: number | null;
    weightedCleanliness: number | null;
    weightedAccuracy: number | null;
    weightedCheckIn: number | null;
    weightedCommunication: number | null;
    weightedLocation: number | null;
    weightedValue: number | null;
    weightedComfort: number | null;
    weightedFacilities: number | null;
    contributingRatingCount: number;
  } | null;

  if (!accommodation) {
    return null;
  }

  const posts = (await db.experiencePost.findMany({
    where: {
      accommodationId: accommodation.id,
      status: "published",
      visibility: "public",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      locationCity: true,
      locationCountry: true,
      tripType: true,
      authorId: true,
      createdAt: true,
    },
  })) as Array<{
    id: string;
    slug: string;
    title: string;
    body: string;
    locationCity: string;
    locationCountry: string;
    tripType: string;
    authorId: string;
    createdAt: Date;
  }>;

  const postIds = posts.map((post) => post.id);
  const ratings =
    postIds.length > 0
      ? ((await db.accommodationRating.findMany({
          where: { postId: { in: postIds } },
          select: { postId: true, overallScore: true },
        })) as Array<{ postId: string; overallScore: number }>)
      : [];
  const ratingMap = new Map<string, number>();
  ratings.forEach((entry) => {
    if (!ratingMap.has(entry.postId)) {
      ratingMap.set(entry.postId, entry.overallScore);
    }
  });

  const cards = await Promise.all(
    posts.map(async (post) => {
      const image = (await db.postImage.findMany({
        where: { postId: post.id },
        orderBy: { order: "asc" },
        take: 1,
        select: { cloudinaryUrl: true },
      })) as Array<{ cloudinaryUrl: string }>;

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.body.slice(0, 190),
        locationCity: post.locationCity,
        locationCountry: post.locationCountry,
        tripType: post.tripType,
        createdAt: post.createdAt,
        leadImageUrl: image[0]?.cloudinaryUrl ?? null,
        individualRating: ratingMap.get(post.id) ?? null,
      } satisfies AccommodationPostCardData;
    }),
  );

  const rawComments = (await db.comment.findMany({
    where: { accommodationId: accommodation.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      authorId: true,
      createdAt: true,
    },
  })) as Array<{ id: string; body: string; authorId: string; createdAt: Date }>;

  const commentAuthorIds = [...new Set(rawComments.map((comment) => comment.authorId))];
  const commentAuthors =
    commentAuthorIds.length > 0
      ? ((await db.user.findMany({
          where: { id: { in: commentAuthorIds } },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        })) as Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>)
      : [];
  const commentAuthorMap = new Map(commentAuthors.map((entry) => [entry.id, entry]));
  const comments: AccommodationCommentData[] = rawComments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    author: commentAuthorMap.get(comment.authorId) ?? null,
  }));

  return {
    ...accommodation,
    anchorPostId: cards[0]?.id ?? null,
    posts: cards,
    comments,
  };
}

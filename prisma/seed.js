const { hash } = require("bcryptjs");

const { TAGS, BASELINE_USERS } = require("./baseline-data.json");
const BASELINE_ADMIN_EMAIL = "anna@trustora.local";

function randomDateWithinLast30Days() {
  const now = Date.now();
  const maxMs = 30 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.floor(Math.random() * maxMs));
}

function weightedScore(weights) {
  const roll = Math.random();
  let cumulative = 0;

  for (const [score, weight] of weights) {
    cumulative += weight;
    if (roll <= cumulative) {
      return score;
    }
  }

  return weights[weights.length - 1][0];
}

function randomCategoryScore(category) {
  // Realistic creator ratings: mostly 4/5, occasional 3.
  const defaultWeights = [
    [3, 0.14],
    [4, 0.52],
    [5, 0.34],
  ];

  // Category-specific tendencies for more plausible baseline data.
  const categoryWeights = {
    communication: [
      [3, 0.09],
      [4, 0.48],
      [5, 0.43],
    ],
    checkIn: [
      [3, 0.1],
      [4, 0.5],
      [5, 0.4],
    ],
    location: [
      [3, 0.12],
      [4, 0.5],
      [5, 0.38],
    ],
    value: [
      [3, 0.22],
      [4, 0.56],
      [5, 0.22],
    ],
    facilities: [
      [3, 0.2],
      [4, 0.54],
      [5, 0.26],
    ],
  };

  return weightedScore(categoryWeights[category] ?? defaultWeights);
}

function buildRandomAccommodationRating() {
  const cleanliness = randomCategoryScore("cleanliness");
  const accuracy = randomCategoryScore("accuracy");
  const checkIn = randomCategoryScore("checkIn");
  const communication = randomCategoryScore("communication");
  const location = randomCategoryScore("location");
  const value = randomCategoryScore("value");
  const comfort = randomCategoryScore("comfort");
  const facilities = randomCategoryScore("facilities");

  const categories = [
    cleanliness,
    accuracy,
    checkIn,
    communication,
    location,
    value,
    comfort,
    facilities,
  ];

  const overallScore =
    Math.round((categories.reduce((sum, score) => sum + score, 0) / categories.length) * 10) / 10;

  return {
    overallScore,
    cleanliness,
    accuracy,
    checkIn,
    communication,
    location,
    value,
    comfort,
    facilities,
    wouldStayAgain: Math.random() > 0.08,
    reviewText: null,
    isVerifiedStay: false,
  };
}

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function accommodationSlug(propertyName, locationCity, locationCountry) {
  return toSlug(`${propertyName}-${locationCity}-${locationCountry}`);
}

function normalizeAccommodationPart(value) {
  return value.trim().toLowerCase();
}

function accommodationKey(story) {
  return [
    normalizeAccommodationPart(story.propertyName),
    normalizeAccommodationPart(story.locationCity),
    normalizeAccommodationPart(story.locationCountry),
  ].join("|");
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function targetPostsPerAccommodation(key) {
  return 4 + (hashString(key) % 7); // 4..10
}

function trimTitle(value) {
  return value.length <= 120 ? value : `${value.slice(0, 117)}...`;
}

function buildExpandedStoriesByUser(baselineUsers) {
  const storiesByAccommodation = new Map();
  const allUserEmails = baselineUsers.map((user) => user.email);

  for (const user of baselineUsers) {
    for (const story of user.stories) {
      const key = accommodationKey(story);
      if (!storiesByAccommodation.has(key)) {
        storiesByAccommodation.set(key, []);
      }
      storiesByAccommodation.get(key).push({
        ...story,
        seedAuthorEmail: user.email,
      });
    }
  }

  const expandedByUser = new Map(allUserEmails.map((email) => [email, []]));

  for (const [key, sourceStories] of storiesByAccommodation.entries()) {
    const targetCount = targetPostsPerAccommodation(key);
    const expandedStories = [...sourceStories];

    for (let i = sourceStories.length; i < targetCount; i += 1) {
      const template = sourceStories[i % sourceStories.length];
      let authorEmail = allUserEmails[i % allUserEmails.length];
      if (allUserEmails.length > 1 && authorEmail === template.seedAuthorEmail) {
        authorEmail = allUserEmails[(i + 1) % allUserEmails.length];
      }

      expandedStories.push({
        ...template,
        seedAuthorEmail: authorEmail,
        title: trimTitle(`${template.title} · Community Stay ${i + 1}`),
        body: `${template.body} Additional stay perspective ${i + 1}.`,
      });
    }

    for (const story of expandedStories) {
      expandedByUser.get(story.seedAuthorEmail).push({
        title: story.title,
        body: story.body,
        locationCity: story.locationCity,
        locationCountry: story.locationCountry,
        propertyName: story.propertyName,
        tripType: story.tripType,
        tags: story.tags,
        images: story.images,
      });
    }
  }

  return expandedByUser;
}

function ageWeight(createdAt, now = new Date()) {
  const ageDays = (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);

  if (ageDays <= 30) return 1;
  if (ageDays <= 180) return 0.75;
  if (ageDays <= 270) return 0.5;
  if (ageDays <= 365) return 0.25;
  return 0;
}

function weightedAverage(entries) {
  const weightedSum = entries.reduce((sum, entry) => sum + entry.value * entry.weight, 0);
  const weightSum = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (weightSum <= 0) {
    return null;
  }

  return Number((weightedSum / weightSum).toFixed(2));
}

async function recomputeAllAccommodationAggregates(prisma) {
  const accommodations = await prisma.accommodation.findMany({
    select: { id: true },
  });

  for (const accommodation of accommodations) {
    const posts = await prisma.experiencePost.findMany({
      where: { accommodationId: accommodation.id },
      select: { id: true },
    });

    if (posts.length === 0) {
      await prisma.accommodation.update({
        where: { id: accommodation.id },
        data: {
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
          aggregateUpdatedAt: new Date(),
        },
      });
      continue;
    }

    const ratings = await prisma.accommodationRating.findMany({
      where: { postId: { in: posts.map((post) => post.id) } },
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
    });

    const weighted = ratings
      .map((rating) => ({ rating, weight: ageWeight(rating.createdAt) }))
      .filter((entry) => entry.weight > 0);

    await prisma.accommodation.update({
      where: { id: accommodation.id },
      data: {
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
        aggregateUpdatedAt: new Date(),
      },
    });
  }
}

function hasPlaceholderDatabaseUrl(value) {
  return typeof value === "string" && (value.includes("<") || value.includes(">"));
}

async function main() {
  if (process.env.USE_IN_MEMORY_DB === "true") {
    console.log("Skipping Prisma seed because USE_IN_MEMORY_DB=true (in-memory mode).");
    return;
  }

  if (!process.env.DATABASE_URL || hasPlaceholderDatabaseUrl(process.env.DATABASE_URL)) {
    throw new Error(
      "DATABASE_URL is not configured for PostgreSQL. Set a valid local DB URL or enable USE_IN_MEMORY_DB=true.",
    );
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const passwordHash = await hash("12345678", 12);

  const tags = await Promise.all(
    TAGS.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));
  const expandedStoriesByUser = buildExpandedStoriesByUser(BASELINE_USERS);

  for (const userSeed of BASELINE_USERS) {
    const role = userSeed.email === BASELINE_ADMIN_EMAIL ? "admin" : "user";

    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        username: userSeed.username,
        displayName: userSeed.displayName,
        avatarUrl: userSeed.avatarUrl,
        bio: userSeed.bio,
        location: userSeed.location,
        role,
        passwordHash,
        isBanned: false,
        createdAt: randomDateWithinLast30Days(),
      },
      create: {
        email: userSeed.email,
        username: userSeed.username,
        displayName: userSeed.displayName,
        avatarUrl: userSeed.avatarUrl,
        bio: userSeed.bio,
        location: userSeed.location,
        role,
        passwordHash,
        isBanned: false,
        createdAt: randomDateWithinLast30Days(),
      },
    });

    await prisma.experiencePost.deleteMany({ where: { authorId: user.id } });

    const storiesForUser = expandedStoriesByUser.get(userSeed.email) ?? [];

    for (let i = 0; i < storiesForUser.length; i += 1) {
      const story = storiesForUser[i];

      const accommodation = await prisma.accommodation.upsert({
        where: {
          name_locationCity_locationCountry: {
            name: story.propertyName,
            locationCity: story.locationCity,
            locationCountry: story.locationCountry,
          },
        },
        update: {},
        create: {
          name: story.propertyName,
          locationCity: story.locationCity,
          locationCountry: story.locationCountry,
          slug: accommodationSlug(story.propertyName, story.locationCity, story.locationCountry),
        },
      });

      const post = await prisma.experiencePost.create({
        data: {
          slug: `${toSlug(story.title)}-${i + 1}`,
          title: story.title,
          body: story.body,
          locationCity: story.locationCity,
          locationCountry: story.locationCountry,
          propertyName: story.propertyName,
          tripType: story.tripType,
          accommodationId: accommodation.id,
          authorId: user.id,
          createdAt: randomDateWithinLast30Days(),
        },
      });

      await prisma.postImage.createMany({
        data: story.images.map((url, index) => ({
          postId: post.id,
          cloudinaryUrl: url,
          order: index,
        })),
      });

      await prisma.postTag.createMany({
        data: story.tags
          .map((tagName) => tagByName.get(tagName))
          .filter(Boolean)
          .map((tag) => ({
            postId: post.id,
            tagId: tag.id,
          })),
      });

      await prisma.accommodationRating.create({
        data: {
          postId: post.id,
          userId: user.id,
          ...buildRandomAccommodationRating(),
          createdAt: randomDateWithinLast30Days(),
        },
      });
    }
  }

  const users = await prisma.user.findMany({ where: { email: { in: BASELINE_USERS.map((u) => u.email) } } });
  if (users.length >= 2) {
    // Create cross-user likes and comments for richer seed data
    const allPosts = await prisma.experiencePost.findMany({ select: { id: true, authorId: true, accommodationId: true } });

    // Each user likes posts from other users
    const likeData = [];
    const commentBodies = [
      "Loved this write-up. Adding this place to my shortlist for late summer.",
      "Great practical details, especially about location and transport.",
      "Thanks for sharing this. The photos and notes made planning super easy.",
      "This sounds exactly like the kind of stay I was looking for.",
      "Beautiful photos! How long did you stay?",
      "Bookmarked. Planning a similar trip next spring.",
      "The description of the neighborhood is so helpful.",
      "Would you go back? Thinking about a longer stay.",
      "This is the kind of honest review that's hard to find.",
      "Perfect timing â€” I was just researching this area.",
    ];
    const commentData = [];

    for (const user of users) {
      const otherPosts = allPosts.filter((p) => p.authorId !== user.id);
      // Each user likes ~5 random posts from others
      const postsToLike = otherPosts.sort(() => 0.5 - Math.random()).slice(0, 5);
      for (const post of postsToLike) {
        likeData.push({ userId: user.id, postId: post.id });
      }
      // Each user comments on ~2 posts from others
      const postsToComment = otherPosts.sort(() => 0.5 - Math.random()).slice(0, 2);
      for (const post of postsToComment) {
        commentData.push({
          authorId: user.id,
          accommodationId: post.accommodationId,
          body: commentBodies[Math.floor(Math.random() * commentBodies.length)],
          createdAt: randomDateWithinLast30Days(),
        });
      }
    }

    await prisma.like.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
    await prisma.comment.deleteMany({ where: { authorId: { in: users.map((u) => u.id) } } });

    await prisma.like.createMany({ data: likeData, skipDuplicates: true });
    await prisma.comment.createMany({ data: commentData });

    // Create some follow relationships
    const followData = [];
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        followData.push({ followerId: users[i].id, followingId: users[j].id });
        if (j % 2 === 0) {
          followData.push({ followerId: users[j].id, followingId: users[i].id });
        }
      }
    }
    await prisma.follow.deleteMany({ where: { followerId: { in: users.map((u) => u.id) } } });
    await prisma.follow.createMany({ data: followData, skipDuplicates: true });

    const reportReasons = [
      "Spam or promotional content",
      "Harassment in the text",
      "Misleading stay description",
      "Inappropriate language",
      "Potential scam indicators",
      "Off-topic content",
    ];

    const reportsByBaselineUsers = await prisma.report.findMany({
      where: { reporterId: { in: users.map((u) => u.id) } },
      select: { id: true },
    });

    if (reportsByBaselineUsers.length > 0) {
      await prisma.report.deleteMany({ where: { id: { in: reportsByBaselineUsers.map((r) => r.id) } } });
    }

    const commentsForReports = await prisma.comment.findMany({
      where: { authorId: { in: users.map((u) => u.id) } },
      select: { id: true, authorId: true },
      take: 24,
    });

    const reportTargets = [
      ...allPosts.map((post) => ({
        targetType: "post",
        targetId: post.id,
        authorId: post.authorId,
      })),
      ...commentsForReports.map((comment) => ({
        targetType: "comment",
        targetId: comment.id,
        authorId: comment.authorId,
      })),
    ];

    const statuses = ["pending", "resolved", "dismissed"];

    const reportData = reportTargets.slice(0, 20).map((target, index) => {
      const reporterPool = users.filter((user) => user.id !== target.authorId);
      const reporter = reporterPool[index % reporterPool.length] ?? users[index % users.length];
      const createdAt = randomDateWithinLast30Days();

      return {
        reporterId: reporter.id,
        targetType: target.targetType,
        targetId: target.targetId,
        reason: reportReasons[index % reportReasons.length],
        status: statuses[index % statuses.length],
        createdAt,
      };
    });

    if (reportData.length > 0) {
      await prisma.report.createMany({ data: reportData });
    }
  }

  await recomputeAllAccommodationAggregates(prisma);

  console.log(`Seeded ${TAGS.length} tags, ${BASELINE_USERS.length} users, baseline stories, ratings, likes, and comments.`);

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


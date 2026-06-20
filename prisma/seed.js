const { hash } = require("bcryptjs");

const { TAGS, BASELINE_USERS } = require("./baseline-data.json");
const BASELINE_ADMIN_EMAIL = "anna@realbnb.local";

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
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
      },
    });

    await prisma.experiencePost.deleteMany({ where: { authorId: user.id } });

    for (let i = 0; i < userSeed.stories.length; i += 1) {
      const story = userSeed.stories[i];

      const post = await prisma.experiencePost.create({
        data: {
          slug: `${toSlug(story.title)}-${i + 1}`,
          title: story.title,
          body: story.body,
          locationCity: story.locationCity,
          locationCountry: story.locationCountry,
          propertyName: story.propertyName,
          tripType: story.tripType,
          authorId: user.id,
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
    }
  }

  const users = await prisma.user.findMany({ where: { email: { in: BASELINE_USERS.map((u) => u.email) } } });
  if (users.length >= 2) {
    // Create cross-user likes and comments for richer seed data
    const allPosts = await prisma.experiencePost.findMany({ select: { id: true, authorId: true } });

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
      "Perfect timing — I was just researching this area.",
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
          postId: post.id,
          body: commentBodies[Math.floor(Math.random() * commentBodies.length)],
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
  }

  console.log(`Seeded ${TAGS.length} tags, ${BASELINE_USERS.length} users, baseline stories, likes, and comments.`);

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

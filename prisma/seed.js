const { hash } = require("bcryptjs");

const TAGS = [
  "beach",
  "city-break",
  "countryside",
  "luxury",
  "budget",
  "pet-friendly",
  "unique-stay",
  "remote-work",
];

const BASELINE_USERS = [
  {
    email: "anna@realbnb.local",
    username: "annawanders",
    displayName: "Anna Mueller",
    bio: "Coffee first, then city walks and hidden guesthouse gems.",
    location: "Berlin, Germany",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    stories: [
      {
        title: "Sunrise Rooftop in Lisbon",
        body: "Quiet mornings, orange rooftops, and a tiny balcony that became my office for three days.",
        locationCity: "Lisbon",
        locationCountry: "Portugal",
        propertyName: "Alfama Rooftop Studio",
        tripType: "solo",
        tags: ["city-break", "remote-work"],
        images: [
          "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Slow Weekend at Lake Como",
        body: "A small villa near the water with mountain views and zero urge to check emails.",
        locationCity: "Como",
        locationCountry: "Italy",
        propertyName: "Villa Bellavista",
        tripType: "couple",
        tags: ["luxury", "countryside"],
        images: [
          "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Rainy Nights in Kyoto",
        body: "Tatami floors, tea every evening, and a calm neighborhood close to tiny ramen bars.",
        locationCity: "Kyoto",
        locationCountry: "Japan",
        propertyName: "Gion Garden Inn",
        tripType: "solo",
        tags: ["city-break", "unique-stay"],
        images: [
          "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Budget Gem in Valencia",
        body: "Small room, great host, free bikes, and incredible local market food around the corner.",
        locationCity: "Valencia",
        locationCountry: "Spain",
        propertyName: "Ruzafa Guest Rooms",
        tripType: "friends",
        tags: ["budget", "city-break"],
        images: [
          "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Countryside Reset in Devon",
        body: "A converted barn, long walks, and a fireplace that made every evening feel like winter cinema.",
        locationCity: "Exeter",
        locationCountry: "United Kingdom",
        propertyName: "Moorland Barn Stay",
        tripType: "family",
        tags: ["countryside", "pet-friendly"],
        images: [
          "https://images.unsplash.com/photo-1475855581690-80accde3a8a1?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Work Sprint in Tallinn",
        body: "Fast wifi, minimalist apartment, and enough cafes nearby for a full week of focus.",
        locationCity: "Tallinn",
        locationCountry: "Estonia",
        propertyName: "Old Town Loft",
        tripType: "business",
        tags: ["remote-work", "city-break"],
        images: [
          "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=1400&q=80",
        ],
      },
    ],
  },
  {
    email: "lukas@realbnb.local",
    username: "lukasontheroad",
    displayName: "Lukas Schneider",
    bio: "Chasing mountain air, surf spots, and practical stays for longer trips.",
    location: "Munich, Germany",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    stories: [
      {
        title: "Surf House in Ericeira",
        body: "Shared kitchen, sunset cliffs, and walking distance to two beginner-friendly beaches.",
        locationCity: "Ericeira",
        locationCountry: "Portugal",
        propertyName: "Blue Tide Surf House",
        tripType: "friends",
        tags: ["beach", "budget"],
        images: [
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Alpine Cabin near Innsbruck",
        body: "Wood interiors, fresh snow, and a sauna with mountain views after long hiking days.",
        locationCity: "Innsbruck",
        locationCountry: "Austria",
        propertyName: "Nordkette Cabin",
        tripType: "couple",
        tags: ["countryside", "luxury"],
        images: [
          "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Family Week in Copenhagen",
        body: "Bright apartment, stroller-friendly neighborhood, and parks in every direction.",
        locationCity: "Copenhagen",
        locationCountry: "Denmark",
        propertyName: "Norrebro Family Flat",
        tripType: "family",
        tags: ["city-break", "pet-friendly"],
        images: [
          "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Remote Month in Tbilisi",
        body: "Affordable loft, super welcoming host, and plenty of coworking spots nearby.",
        locationCity: "Tbilisi",
        locationCountry: "Georgia",
        propertyName: "Mtatsminda Loft",
        tripType: "business",
        tags: ["remote-work", "budget"],
        images: [
          "https://images.unsplash.com/photo-1544989164-31b2b9a3161f?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Design Stay in Rotterdam",
        body: "Modern studio with huge windows and easy tram access to the whole city.",
        locationCity: "Rotterdam",
        locationCountry: "Netherlands",
        propertyName: "Cube Quarter Studio",
        tripType: "solo",
        tags: ["city-break", "unique-stay"],
        images: [
          "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1400&q=80",
        ],
      },
      {
        title: "Island Pause in Hvar",
        body: "Stone house, crystal water, and simple evenings with local food and no schedule.",
        locationCity: "Hvar",
        locationCountry: "Croatia",
        propertyName: "Old Port Retreat",
        tripType: "couple",
        tags: ["beach", "unique-stay"],
        images: [
          "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=1400&q=80",
        ],
      },
    ],
  },
];

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
    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        username: userSeed.username,
        displayName: userSeed.displayName,
        avatarUrl: userSeed.avatarUrl,
        bio: userSeed.bio,
        location: userSeed.location,
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
        role: "user",
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
  if (users.length === 2) {
    const [first, second] = users;
    const firstPosts = await prisma.experiencePost.findMany({ where: { authorId: first.id }, select: { id: true } });
    const secondPosts = await prisma.experiencePost.findMany({ where: { authorId: second.id }, select: { id: true } });

    await prisma.like.deleteMany({
      where: {
        OR: [
          { userId: first.id, postId: { in: secondPosts.map((p) => p.id) } },
          { userId: second.id, postId: { in: firstPosts.map((p) => p.id) } },
        ],
      },
    });

    await prisma.like.createMany({
      data: [
        ...secondPosts.slice(0, 3).map((post) => ({ userId: first.id, postId: post.id })),
        ...firstPosts.slice(0, 2).map((post) => ({ userId: second.id, postId: post.id })),
      ],
    });
  }

  console.log(`Seeded ${TAGS.length} tags, ${BASELINE_USERS.length} users, and baseline stories.`);

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

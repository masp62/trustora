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

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  await Promise.all(
    TAGS.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log(`Seeded ${TAGS.length} predefined tags.`);

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

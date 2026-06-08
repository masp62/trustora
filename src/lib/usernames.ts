import { db } from "@/lib/db";

function normalizeUsername(seed: string) {
  const normalized = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.length >= 3) {
    return normalized.slice(0, 24);
  }

  return "traveler";
}

export async function generateUniqueUsername(seed: string) {
  const base = normalizeUsername(seed);

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const suffix =
      attempt === 0
        ? ""
        : `-${Math.floor(Math.random() * 90 + 10)
            .toString()
            .padStart(2, "0")}`;
    const candidate = `${base.slice(0, 24 - suffix.length)}${suffix}`;

    const existing = await db.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base.slice(0, 21)}-${Math.floor(Math.random() * 90 + 10)}`;
}

"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { type AuthActionState } from "@/lib/auth-action-state";
import { db } from "@/lib/db";

function parseField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/;

export async function updateProfile(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const displayName = parseField(formData.get("displayName"));
  const bio = parseField(formData.get("bio"));
  const location = parseField(formData.get("location"));
  const username = parseField(formData.get("username")).toLowerCase();
  const avatarUrl = parseField(formData.get("avatarUrl")) || null;

  if (!displayName) {
    return { error: "Display name is required." };
  }

  if (!username) {
    return { error: "Username is required." };
  }

  if (!USERNAME_RE.test(username)) {
    return {
      error:
        "Username must be 2–24 lowercase letters, numbers, or hyphens, and cannot start or end with a hyphen.",
    };
  }

  if (bio.length > 280) {
    return { error: "Bio must be 280 characters or less." };
  }

  // Check username uniqueness (skip if unchanged)
  const currentUser = (await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })) as { username: string } | null;

  if (!currentUser) {
    redirect("/login");
  }

  if (username !== currentUser.username) {
    const existing = (await db.user.findUnique({
      where: { username },
      select: { id: true },
    })) as { id: string } | null;

    if (existing) {
      return { error: "This username is already taken." };
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      bio: bio || null,
      location: location || null,
      username,
      avatarUrl,
    },
  });

  redirect(`/u/${username}`);
}

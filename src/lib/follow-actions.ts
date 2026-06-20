"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function isDuplicateFollowError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("already exists") || error.message.includes("P2002");
}

export async function setFollowStatus(targetUserId: string, shouldFollow: boolean) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false as const, error: "AUTH_REQUIRED" as const };
    }

    const currentUserId = session.user.id;

    if (currentUserId === targetUserId) {
      return { ok: false as const, error: "SELF_FOLLOW_NOT_ALLOWED" as const };
    }

    const [targetUser, currentUser] = (await Promise.all([
      db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true },
      }),
      db.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, username: true },
      }),
    ])) as [{ id: string; username: string } | null, { id: string; username: string } | null];

    if (!targetUser) {
      return { ok: false as const, error: "TARGET_NOT_FOUND" as const };
    }

    if (!currentUser) {
      return { ok: false as const, error: "AUTH_REQUIRED" as const };
    }

    const existingFollowCount = await db.follow.count({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    const alreadyFollowing = existingFollowCount > 0;

    if (shouldFollow && !alreadyFollowing) {
      try {
        await db.follow.create({
          data: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        });
      } catch (error) {
        if (!isDuplicateFollowError(error)) {
          throw error;
        }
      }
    }

    if (!shouldFollow && alreadyFollowing) {
      await db.follow.deleteMany({
        where: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
    }

    const [followerCount, followCount] = await Promise.all([
      db.follow.count({ where: { followingId: targetUserId } }),
      db.follow.count({
        where: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      }),
    ]);

    revalidatePath(`/u/${targetUser.username}`);
    revalidatePath(`/u/${targetUser.username}/followers`);
    revalidatePath(`/u/${targetUser.username}/following`);
    revalidatePath(`/u/${currentUser.username}`);
    revalidatePath(`/u/${currentUser.username}/followers`);
    revalidatePath(`/u/${currentUser.username}/following`);
    revalidatePath("/");

    return {
      ok: true as const,
      followed: followCount > 0,
      followerCount,
    };
  } catch {
    return { ok: false as const, error: "UNKNOWN" as const };
  }
}
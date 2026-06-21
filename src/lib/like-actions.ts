"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function isDuplicateLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("already exists") || error.message.includes("P2002");
}

export async function setPostLikeStatus(postId: string, shouldLike: boolean) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false as const, error: "AUTH_REQUIRED" as const };
    }

    const post = (await db.experiencePost.findUnique({
      where: { id: postId },
      select: { id: true, slug: true, authorId: true, status: true },
    })) as { id: string; slug: string; authorId: string; status: "draft" | "published" } | null;

    if (!post) {
      return { ok: false as const, error: "POST_NOT_FOUND" as const };
    }

    if (post.status === "draft" && post.authorId !== session.user.id) {
      return { ok: false as const, error: "POST_NOT_FOUND" as const };
    }

    const userId = session.user.id;
    const existingLikeCount = await db.like.count({ where: { postId, userId } });
    const alreadyLiked = existingLikeCount > 0;

    if (shouldLike && !alreadyLiked) {
      try {
        await db.like.create({ data: { postId, userId } });
      } catch (error) {
        if (!isDuplicateLikeError(error)) {
          throw error;
        }
      }
    }

    if (!shouldLike && alreadyLiked) {
      await db.like.deleteMany({ where: { postId, userId } });
    }

    const [likeCount, userLikeCount] = await Promise.all([
      db.like.count({ where: { postId } }),
      db.like.count({ where: { postId, userId } }),
    ]);

    revalidatePath("/explore");
    revalidatePath(`/post/${post.id}`);
    revalidatePath(`/post/${post.id}/${post.slug}`);

    return {
      ok: true as const,
      liked: userLikeCount > 0,
      likeCount,
    };
  } catch {
    return { ok: false as const, error: "UNKNOWN" as const };
  }
}
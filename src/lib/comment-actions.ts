"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { postCanonicalPath } from "@/app/post/post-detail-data";
import { db } from "@/lib/db";

const COMMENT_MAX_LENGTH = 2000;

function parseCommentBody(value: string) {
  return value.trim();
}

export async function addPostComment(postId: string, rawBody: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false as const, error: "AUTH_REQUIRED" as const };
    }

    const currentUser = (await db.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true },
    })) as { isBanned: boolean } | null;

    if (currentUser?.isBanned) {
      return {
        ok: false as const,
        error: "BANNED" as const,
        message: "Your account is banned. You cannot create posts or comments.",
      };
    }

    const body = parseCommentBody(rawBody);
    if (!body) {
      return {
        ok: false as const,
        error: "VALIDATION" as const,
        message: "Comment cannot be empty.",
      };
    }

    if (body.length > COMMENT_MAX_LENGTH) {
      return {
        ok: false as const,
        error: "VALIDATION" as const,
        message: `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`,
      };
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

    const comment = (await db.comment.create({
      data: {
        postId,
        authorId: session.user.id,
        body,
      },
      select: {
        id: true,
        body: true,
        authorId: true,
        createdAt: true,
      },
    })) as { id: string; body: string; authorId: string; createdAt: Date };

    const author = (await db.user.findUnique({
      where: { id: comment.authorId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    })) as { id: string; username: string; displayName: string; avatarUrl: string | null } | null;

    revalidatePath(`/post/${post.id}`);
    revalidatePath(postCanonicalPath(post.id, post.slug));

    return {
      ok: true as const,
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author,
      },
    };
  } catch {
    return { ok: false as const, error: "UNKNOWN" as const };
  }
}

export async function deletePostComment(commentId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false as const, error: "AUTH_REQUIRED" as const };
    }

    const comment = (await db.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        postId: true,
      },
    })) as {
      id: string;
      authorId: string;
      postId: string;
    } | null;

    if (!comment) {
      return { ok: false as const, error: "COMMENT_NOT_FOUND" as const };
    }

    if (comment.authorId !== session.user.id) {
      return { ok: false as const, error: "FORBIDDEN" as const };
    }

    const post = (await db.experiencePost.findUnique({
      where: { id: comment.postId },
      select: {
        id: true,
        slug: true,
      },
    })) as { id: string; slug: string } | null;

    if (!post) {
      return { ok: false as const, error: "POST_NOT_FOUND" as const };
    }

    await db.comment.delete({ where: { id: commentId } });

    revalidatePath(`/post/${post.id}`);
    revalidatePath(postCanonicalPath(post.id, post.slug));

    return { ok: true as const, commentId };
  } catch {
    return { ok: false as const, error: "UNKNOWN" as const };
  }
}
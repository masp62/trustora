"use server";

import type { ReportStatus, ReportTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { postCanonicalPath } from "@/app/post/post-detail-data";
import { db } from "@/lib/db";
import { REPORT_STATUS, REPORT_TARGET_TYPE, USER_ROLE } from "@/lib/prisma-enum-values";

type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; error: "AUTH_REQUIRED" | "FORBIDDEN" | "VALIDATION" | "NOT_FOUND" | "UNKNOWN"; message: string };

async function getAdminUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false as const, error: "AUTH_REQUIRED" as const };
  }

  if (session.user.role !== USER_ROLE.admin) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  return { ok: true as const, userId: session.user.id };
}

async function findPendingReport(reportId: string) {
  return (await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, targetType: true, targetId: true },
  })) as {
    id: string;
    status: ReportStatus;
    targetType: ReportTargetType;
    targetId: string;
  } | null;
}

export async function dismissReport(reportId: string): Promise<AdminActionResult> {
  try {
    const admin = await getAdminUserId();
    if (!admin.ok) {
      return { ok: false, error: admin.error, message: "Admin access is required." };
    }

    const report = await findPendingReport(reportId.trim());
    if (!report || report.status !== REPORT_STATUS.pending) {
      return { ok: false, error: "NOT_FOUND", message: "Pending report not found." };
    }

    await db.report.update({
      where: { id: report.id },
      data: { status: REPORT_STATUS.dismissed },
    });

    revalidatePath("/admin");

    return { ok: true, message: "Report dismissed." };
  } catch {
    return { ok: false, error: "UNKNOWN", message: "Could not dismiss report." };
  }
}

export async function removeReportedTarget(reportId: string, confirmation: string): Promise<AdminActionResult> {
  try {
    const admin = await getAdminUserId();
    if (!admin.ok) {
      return { ok: false, error: admin.error, message: "Admin access is required." };
    }

    if (confirmation !== "REMOVE") {
      return {
        ok: false,
        error: "VALIDATION",
        message: "Type REMOVE to confirm this destructive action.",
      };
    }

    const report = await findPendingReport(reportId.trim());
    if (!report || report.status !== REPORT_STATUS.pending) {
      return { ok: false, error: "NOT_FOUND", message: "Pending report not found." };
    }

    if (report.targetType === REPORT_TARGET_TYPE.post) {
      const post = (await db.experiencePost.findUnique({
        where: { id: report.targetId },
        select: { id: true, slug: true },
      })) as { id: string; slug: string } | null;

      if (post) {
        await db.experiencePost.delete({ where: { id: post.id } });
        revalidatePath(`/post/${post.id}`);
        revalidatePath(postCanonicalPath(post.id, post.slug));
      }
    }

    if (report.targetType === REPORT_TARGET_TYPE.comment) {
      const comment = (await db.comment.findUnique({
        where: { id: report.targetId },
        select: { id: true, accommodationId: true },
      })) as { id: string; accommodationId: string } | null;

      if (comment) {
        await db.comment.delete({ where: { id: comment.id } });

        const post = ((await db.experiencePost.findMany({
          where: { accommodationId: comment.accommodationId },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, slug: true },
        })) as Array<{ id: string; slug: string }>)[0] ?? null;

        if (post) {
          revalidatePath(`/post/${post.id}`);
          revalidatePath(postCanonicalPath(post.id, post.slug));
        }
      }
    }

    await db.report.update({
      where: { id: report.id },
      data: { status: REPORT_STATUS.resolved },
    });

    revalidatePath("/admin");

    return { ok: true, message: "Content removed and report resolved." };
  } catch {
    return { ok: false, error: "UNKNOWN", message: "Could not remove content." };
  }
}

export async function banUserFromReport(reportId: string, confirmation: string): Promise<AdminActionResult> {
  try {
    const admin = await getAdminUserId();
    if (!admin.ok) {
      return { ok: false, error: admin.error, message: "Admin access is required." };
    }

    if (confirmation !== "BAN") {
      return {
        ok: false,
        error: "VALIDATION",
        message: "Type BAN to confirm this destructive action.",
      };
    }

    const report = await findPendingReport(reportId.trim());
    if (!report || report.status !== REPORT_STATUS.pending) {
      return { ok: false, error: "NOT_FOUND", message: "Pending report not found." };
    }

    let targetAuthorId: string | null = null;

    if (report.targetType === REPORT_TARGET_TYPE.post) {
      const post = (await db.experiencePost.findUnique({
        where: { id: report.targetId },
        select: { authorId: true },
      })) as { authorId: string } | null;

      targetAuthorId = post?.authorId ?? null;
    }

    if (report.targetType === REPORT_TARGET_TYPE.comment) {
      const comment = (await db.comment.findUnique({
        where: { id: report.targetId },
        select: { authorId: true },
      })) as { authorId: string } | null;

      targetAuthorId = comment?.authorId ?? null;
    }

    if (!targetAuthorId) {
      return { ok: false, error: "NOT_FOUND", message: "Could not determine the target user to ban." };
    }

    await db.user.update({
      where: { id: targetAuthorId },
      data: { isBanned: true },
    });

    await db.report.update({
      where: { id: report.id },
      data: { status: REPORT_STATUS.resolved },
    });

    revalidatePath("/admin");

    return { ok: true, message: "User banned and report resolved." };
  } catch {
    return { ok: false, error: "UNKNOWN", message: "Could not ban user." };
  }
}
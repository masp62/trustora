"use server";

import { revalidatePath } from "next/cache";
import { ReportStatus, ReportTargetType } from "@prisma/client";

import { auth } from "@/auth";
import { postCanonicalPath } from "@/app/post/post-detail-data";
import { db } from "@/lib/db";

const REPORT_REASON_MAX_LENGTH = 1000;

type ReportTarget = "post" | "comment";

function parseReason(rawReason: string) {
  const trimmed = rawReason.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toReportTargetType(value: ReportTarget): ReportTargetType {
  return value === "post" ? ReportTargetType.post : ReportTargetType.comment;
}

export async function submitTargetReport({
  targetType,
  targetId,
  reason,
}: {
  targetType: ReportTarget;
  targetId: string;
  reason: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false as const, error: "AUTH_REQUIRED" as const };
    }

    const trimmedTargetId = targetId.trim();
    if (!trimmedTargetId) {
      return { ok: false as const, error: "TARGET_NOT_FOUND" as const };
    }

    const parsedReason = parseReason(reason);
    if (parsedReason && parsedReason.length > REPORT_REASON_MAX_LENGTH) {
      return {
        ok: false as const,
        error: "VALIDATION" as const,
        message: `Reason must be ${REPORT_REASON_MAX_LENGTH} characters or fewer.`,
      };
    }

    const reportTargetType = toReportTargetType(targetType);
    const reporterId = session.user.id;

    const duplicateCount = await db.report.count({
      where: {
        reporterId,
        targetType: reportTargetType,
        targetId: trimmedTargetId,
      },
    });

    if (duplicateCount > 0) {
      return {
        ok: true as const,
        alreadyReported: true as const,
        message: "You already reported this.",
      };
    }

    if (targetType === "post") {
      const post = (await db.experiencePost.findUnique({
        where: { id: trimmedTargetId },
        select: { id: true, slug: true },
      })) as { id: string; slug: string } | null;

      if (!post) {
        return { ok: false as const, error: "TARGET_NOT_FOUND" as const };
      }

      await db.report.create({
        data: {
          reporterId,
          targetType: reportTargetType,
          targetId: trimmedTargetId,
          reason: parsedReason,
          status: ReportStatus.pending,
        },
      });

      revalidatePath(`/post/${post.id}`);
      revalidatePath(postCanonicalPath(post.id, post.slug));
    } else {
      const comment = (await db.comment.findUnique({
        where: { id: trimmedTargetId },
        select: { id: true, postId: true },
      })) as { id: string; postId: string } | null;

      if (!comment) {
        return { ok: false as const, error: "TARGET_NOT_FOUND" as const };
      }

      const post = (await db.experiencePost.findUnique({
        where: { id: comment.postId },
        select: { id: true, slug: true },
      })) as { id: string; slug: string } | null;

      if (!post) {
        return { ok: false as const, error: "TARGET_NOT_FOUND" as const };
      }

      await db.report.create({
        data: {
          reporterId,
          targetType: reportTargetType,
          targetId: trimmedTargetId,
          reason: parsedReason,
          status: ReportStatus.pending,
        },
      });

      revalidatePath(`/post/${post.id}`);
      revalidatePath(postCanonicalPath(post.id, post.slug));
    }

    return {
      ok: true as const,
      alreadyReported: false as const,
      message: "Thanks. Your report has been submitted.",
    };
  } catch {
    return { ok: false as const, error: "UNKNOWN" as const };
  }
}
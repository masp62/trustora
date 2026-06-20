import { ReportStatus, ReportTargetType } from "@prisma/client";

import { db } from "@/lib/db";

export type AdminQueueItem = {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string | null;
  createdAt: Date;
  reporterUsername: string;
  reporterDisplayName: string;
  targetPreview: string;
  targetAuthorId: string | null;
  targetAuthorUsername: string | null;
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

export async function getPendingAdminQueue(): Promise<AdminQueueItem[]> {
  const reports = (await db.report.findMany({
    where: { status: ReportStatus.pending },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reporterId: true,
      reason: true,
      createdAt: true,
    },
  })) as Array<{
    id: string;
    targetType: ReportTargetType;
    targetId: string;
    reporterId: string;
    reason: string | null;
    createdAt: Date;
  }>;

  const sortedReports = [...reports].sort((left, right) => {
    const byTime = right.createdAt.getTime() - left.createdAt.getTime();
    if (byTime !== 0) {
      return byTime;
    }
    return right.id.localeCompare(left.id);
  });

  const reporterIds = [...new Set(sortedReports.map((report) => report.reporterId))];
  const postTargetIds = sortedReports
    .filter((report) => report.targetType === ReportTargetType.post)
    .map((report) => report.targetId);
  const commentTargetIds = sortedReports
    .filter((report) => report.targetType === ReportTargetType.comment)
    .map((report) => report.targetId);

  const [reporters, posts, comments] = await Promise.all([
    reporterIds.length > 0
      ? ((await db.user.findMany({
          where: { id: { in: reporterIds } },
          select: { id: true, username: true, displayName: true },
        })) as Array<{ id: string; username: string; displayName: string }>)
      : [],
    postTargetIds.length > 0
      ? ((await db.experiencePost.findMany({
          where: { id: { in: postTargetIds } },
          select: { id: true, title: true, body: true, authorId: true },
        })) as Array<{ id: string; title: string; body: string; authorId: string }>)
      : [],
    commentTargetIds.length > 0
      ? ((await db.comment.findMany({
          where: { id: { in: commentTargetIds } },
          select: { id: true, body: true, authorId: true },
        })) as Array<{ id: string; body: string; authorId: string }>)
      : [],
  ]);

  const targetAuthorIds = [
    ...new Set([...posts.map((post) => post.authorId), ...comments.map((comment) => comment.authorId)]),
  ];

  const targetAuthors =
    targetAuthorIds.length > 0
      ? ((await db.user.findMany({
          where: { id: { in: targetAuthorIds } },
          select: { id: true, username: true },
        })) as Array<{ id: string; username: string }>)
      : [];

  const reporterById = new Map(reporters.map((entry) => [entry.id, entry]));
  const postById = new Map(posts.map((entry) => [entry.id, entry]));
  const commentById = new Map(comments.map((entry) => [entry.id, entry]));
  const targetAuthorById = new Map(targetAuthors.map((entry) => [entry.id, entry]));

  return sortedReports.map((report) => {
    const reporter = reporterById.get(report.reporterId);

    if (report.targetType === ReportTargetType.post) {
      const post = postById.get(report.targetId);
      const targetAuthor = post ? targetAuthorById.get(post.authorId) : null;

      return {
        id: report.id,
        targetType: "post" as const,
        targetId: report.targetId,
        reason: report.reason,
        createdAt: report.createdAt,
        reporterUsername: reporter?.username ?? "unknown-user",
        reporterDisplayName: reporter?.displayName ?? "Unknown reporter",
        targetPreview: post
          ? `${post.title} - ${truncate(post.body, 120)}`
          : "Reported post no longer exists.",
        targetAuthorId: post?.authorId ?? null,
        targetAuthorUsername: targetAuthor?.username ?? null,
      };
    }

    const comment = commentById.get(report.targetId);
    const targetAuthor = comment ? targetAuthorById.get(comment.authorId) : null;

    return {
      id: report.id,
      targetType: "comment" as const,
      targetId: report.targetId,
      reason: report.reason,
      createdAt: report.createdAt,
      reporterUsername: reporter?.username ?? "unknown-user",
      reporterDisplayName: reporter?.displayName ?? "Unknown reporter",
      targetPreview: comment ? truncate(comment.body, 120) : "Reported comment no longer exists.",
      targetAuthorId: comment?.authorId ?? null,
      targetAuthorUsername: targetAuthor?.username ?? null,
    };
  });
}
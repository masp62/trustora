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

type ActivityPoint = {
  label: string;
  count: number;
};

type RankedEntry = {
  label: string;
  secondaryLabel: string;
  count: number;
};

type LocationEntry = {
  label: string;
  count: number;
};

export type AdminOverviewData = {
  totals: {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    activeReports: number;
    bannedUsers: number;
  };
  activity: {
    registrations: ActivityPoint[];
    posts: ActivityPoint[];
    comments: ActivityPoint[];
    reports: ActivityPoint[];
  };
  topContent: {
    mostLikedPosts: RankedEntry[];
    mostCommentedPosts: RankedEntry[];
  };
  engagement: {
    mostActiveAuthors: RankedEntry[];
    mostActiveCommenters: RankedEntry[];
  };
  geography: {
    topCountries: LocationEntry[];
    topCities: LocationEntry[];
  };
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

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dateLabel(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildLastNDaysRange(days: number) {
  const today = startOfDay(new Date());
  const dates: Date[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    dates.push(date);
  }

  return dates;
}

function buildDailySeries(entries: Date[], days: number): ActivityPoint[] {
  const range = buildLastNDaysRange(days);
  const counter = new Map<string, number>();

  for (const entry of entries) {
    const label = dateLabel(startOfDay(entry));
    counter.set(label, (counter.get(label) ?? 0) + 1);
  }

  return range.map((date) => {
    const label = dateLabel(date);
    return { label, count: counter.get(label) ?? 0 };
  });
}

function rankByCount(
  counts: Map<string, number>,
  resolve: (id: string) => { label: string; secondaryLabel: string } | null,
  limit: number,
): RankedEntry[] {
  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([id, count]) => {
      const resolved = resolve(id);
      if (!resolved) {
        return null;
      }

      return {
        label: resolved.label,
        secondaryLabel: resolved.secondaryLabel,
        count,
      };
    })
    .filter((entry): entry is RankedEntry => Boolean(entry));
}

function rankLocations(counts: Map<string, number>, limit: number): LocationEntry[] {
  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const [totalUsers, totalPosts, totalComments, totalLikes, activeReports, bannedUsers] = await Promise.all([
    db.user.count(),
    db.experiencePost.count(),
    db.comment.count(),
    db.like.count(),
    db.report.count({ where: { status: ReportStatus.pending } }),
    db.user.count({ where: { isBanned: true } }),
  ]);

  const [users, posts, comments, likes, reports] = await Promise.all([
    db.user.findMany({
      select: { id: true, username: true, createdAt: true },
    }) as Promise<Array<{ id: string; username: string; createdAt: Date }>>,
    db.experiencePost.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        locationCountry: true,
        locationCity: true,
        createdAt: true,
      },
    }) as Promise<
      Array<{
        id: string;
        title: string;
        authorId: string;
        locationCountry: string;
        locationCity: string;
        createdAt: Date;
      }>
    >,
    db.comment.findMany({
      select: { id: true, authorId: true, postId: true, createdAt: true },
    }) as Promise<Array<{ id: string; authorId: string; postId: string; createdAt: Date }>>,
    db.like.findMany({
      select: { id: true, postId: true },
    }) as Promise<Array<{ id: string; postId: string }>>,
    db.report.findMany({
      select: { id: true, createdAt: true },
    }) as Promise<Array<{ id: string; createdAt: Date }>>,
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const postById = new Map(posts.map((post) => [post.id, post]));

  const likesByPost = new Map<string, number>();
  for (const like of likes) {
    likesByPost.set(like.postId, (likesByPost.get(like.postId) ?? 0) + 1);
  }

  const commentsByPost = new Map<string, number>();
  const commentsByAuthor = new Map<string, number>();
  for (const comment of comments) {
    commentsByPost.set(comment.postId, (commentsByPost.get(comment.postId) ?? 0) + 1);
    commentsByAuthor.set(comment.authorId, (commentsByAuthor.get(comment.authorId) ?? 0) + 1);
  }

  const postsByAuthor = new Map<string, number>();
  const countries = new Map<string, number>();
  const cities = new Map<string, number>();
  for (const post of posts) {
    postsByAuthor.set(post.authorId, (postsByAuthor.get(post.authorId) ?? 0) + 1);
    countries.set(post.locationCountry, (countries.get(post.locationCountry) ?? 0) + 1);
    cities.set(post.locationCity, (cities.get(post.locationCity) ?? 0) + 1);
  }

  const mostLikedPosts = rankByCount(
    likesByPost,
    (postId) => {
      const post = postById.get(postId);
      if (!post) {
        return null;
      }
      const author = userById.get(post.authorId);
      return {
        label: post.title,
        secondaryLabel: `@${author?.username ?? "unknown"}`,
      };
    },
    5,
  );

  const mostCommentedPosts = rankByCount(
    commentsByPost,
    (postId) => {
      const post = postById.get(postId);
      if (!post) {
        return null;
      }
      const author = userById.get(post.authorId);
      return {
        label: post.title,
        secondaryLabel: `@${author?.username ?? "unknown"}`,
      };
    },
    5,
  );

  const mostActiveAuthors = rankByCount(
    postsByAuthor,
    (userId) => {
      const user = userById.get(userId);
      if (!user) {
        return null;
      }
      return {
        label: `@${user.username}`,
        secondaryLabel: "Posts",
      };
    },
    5,
  );

  const mostActiveCommenters = rankByCount(
    commentsByAuthor,
    (userId) => {
      const user = userById.get(userId);
      if (!user) {
        return null;
      }
      return {
        label: `@${user.username}`,
        secondaryLabel: "Comments",
      };
    },
    5,
  );

  return {
    totals: {
      totalUsers,
      totalPosts,
      totalComments,
      totalLikes,
      activeReports,
      bannedUsers,
    },
    activity: {
      registrations: buildDailySeries(users.map((user) => user.createdAt), 30),
      posts: buildDailySeries(posts.map((post) => post.createdAt), 30),
      comments: buildDailySeries(comments.map((comment) => comment.createdAt), 30),
      reports: buildDailySeries(reports.map((report) => report.createdAt), 30),
    },
    topContent: {
      mostLikedPosts,
      mostCommentedPosts,
    },
    engagement: {
      mostActiveAuthors,
      mostActiveCommenters,
    },
    geography: {
      topCountries: rankLocations(countries, 10),
      topCities: rankLocations(cities, 10),
    },
  };
}
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { banUserFromReport, dismissReport, removeReportedTarget } from "@/lib/admin-actions";

type AdminQueueItemClient = {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  reason: string | null;
  createdAt: string;
  reporterUsername: string;
  reporterDisplayName: string;
  targetPreview: string;
  targetAuthorId: string | null;
  targetAuthorUsername: string | null;
};

type AdminDashboardClientProps = {
  initialOverview: {
    totals: {
      totalUsers: number;
      totalPosts: number;
      totalComments: number;
      totalLikes: number;
      activeReports: number;
      bannedUsers: number;
    };
    activity: {
      registrations: Array<{ label: string; count: number }>;
      posts: Array<{ label: string; count: number }>;
      comments: Array<{ label: string; count: number }>;
      reports: Array<{ label: string; count: number }>;
    };
    topContent: {
      mostLikedPosts: Array<{ label: string; secondaryLabel: string; count: number }>;
      mostCommentedPosts: Array<{ label: string; secondaryLabel: string; count: number }>;
    };
    engagement: {
      mostActiveAuthors: Array<{ label: string; secondaryLabel: string; count: number }>;
      mostActiveCommenters: Array<{ label: string; secondaryLabel: string; count: number }>;
    };
    geography: {
      topCountries: Array<{ label: string; count: number }>;
      topCities: Array<{ label: string; count: number }>;
    };
  };
  initialReports: AdminQueueItemClient[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

type ReportModerationActionsProps = {
  report: AdminQueueItemClient;
  onResolved: (reportId: string) => void;
};

function ReportModerationActions({ report, onResolved }: ReportModerationActionsProps) {
  const [activeConfirm, setActiveConfirm] = useState<"remove" | "ban" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requiredToken = activeConfirm === "remove" ? "REMOVE" : activeConfirm === "ban" ? "BAN" : "";

  function runDismiss() {
    if (isPending) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await dismissReport(report.id);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMessage(result.message);
      onResolved(report.id);
    });
  }

  function runConfirmedAction() {
    if (isPending || !activeConfirm) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result =
        activeConfirm === "remove"
          ? await removeReportedTarget(report.id, confirmText)
          : await banUserFromReport(report.id, confirmText);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMessage(result.message);
      onResolved(report.id);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runDismiss}
          disabled={isPending}
          className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Dismiss
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveConfirm("remove");
            setConfirmText("");
            setMessage(null);
          }}
          disabled={isPending}
          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {report.targetType === "post" ? "Remove post" : "Remove comment"}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveConfirm("ban");
            setConfirmText("");
            setMessage(null);
          }}
          disabled={isPending}
          className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Ban user
        </button>
      </div>

      {activeConfirm && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-900">
            This action is destructive. Type {requiredToken} to confirm.
          </p>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.currentTarget.value)}
            placeholder={`Type ${requiredToken}`}
            className="w-full rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveConfirm(null);
                setConfirmText("");
              }}
              className="rounded-full px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={runConfirmedAction}
              disabled={isPending || confirmText !== requiredToken}
              className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="text-xs text-gray-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function RankedList({
  title,
  entries,
  emptyLabel,
}: {
  title: string;
  entries: Array<{ label: string; secondaryLabel: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">{emptyLabel}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {entries.map((entry, index) => (
            <li key={`${entry.label}-${index}`} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{entry.label}</p>
                <p className="text-xs text-gray-600">{entry.secondaryLabel}</p>
              </div>
              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {entry.count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LocationList({
  title,
  entries,
  emptyLabel,
}: {
  title: string;
  entries: Array<{ label: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.label} className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-800">{entry.label}</span>
              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {entry.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActivityList({
  title,
  points,
}: {
  title: string;
  points: Array<{ label: string; count: number }>;
}) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const next = entries[0];
      if (!next) {
        return;
      }

      const nextWidth = Math.floor(next.contentRect.width);
      const nextHeight = Math.floor(next.contentRect.height);

      if (nextWidth <= 0 || nextHeight <= 0) {
        return;
      }

      setChartSize((prev) => {
        if (prev && prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }

        return { width: nextWidth, height: nextHeight };
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const chartData = points.map((point) => ({
    ...point,
    xLabel: point.label.slice(5),
  }));

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="mt-1 text-xs text-gray-600">Last 30 days</p>
      <div ref={chartContainerRef} className="mt-3 h-64 w-full" aria-label={`${title} bar chart`}>
        {chartSize ? (
          <BarChart width={chartSize.width} height={chartSize.height} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="xLabel"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              interval={4}
              minTickGap={12}
              label={{ value: "Time (last 30 days)", position: "insideBottom", offset: -2, fill: "#6b7280" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              label={{ value: "Count", angle: -90, position: "insideLeft", fill: "#6b7280" }}
            />
            <Tooltip
              formatter={(value) => [Number(value ?? 0), "Count"]}
              labelFormatter={(value) => `Date: ${String(value)}`}
            />
            <Bar dataKey="count" fill="#0ea5a4" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}

function ReportQueueSection({
  reports,
  onResolved,
}: {
  reports: AdminQueueItemClient[];
  onResolved: (reportId: string) => void;
}) {
  const hasReports = reports.length > 0;

  const pendingCountLabel = reports.length === 1 ? "1 pending report" : `${reports.length} pending reports`;

  if (!hasReports) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm font-semibold text-gray-700">No pending reports. Moderation queue is clear.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Pending report queue">
      <h2 className="font-heading text-2xl text-gray-900">Report queue</h2>
      <p className="text-sm font-semibold text-gray-700">{pendingCountLabel}</p>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs tracking-wide text-gray-600 uppercase">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reported content</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-t border-gray-200 align-top">
                <td className="px-4 py-4">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {report.targetType}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-[360px] text-sm text-gray-800">{report.targetPreview}</p>
                  <p className="mt-1 text-xs text-gray-500">Target ID: {report.targetId}</p>
                  <p className="text-xs text-gray-500">Target user: {report.targetAuthorUsername ?? "unknown"}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-gray-800">@{report.reporterUsername}</p>
                  <p className="text-xs text-gray-500">{report.reporterDisplayName}</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">{report.reason ? truncate(report.reason, 140) : "-"}</td>
                <td className="px-4 py-4 text-xs text-gray-600">{formatDate(report.createdAt)}</td>
                <td className="px-4 py-4">
                  <ReportModerationActions report={report} onResolved={onResolved} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {reports.map((report) => (
          <li key={report.id} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {report.targetType}
              </span>
              <time className="text-xs text-gray-600">{formatDate(report.createdAt)}</time>
            </div>

            <p className="text-sm text-gray-800">{report.targetPreview}</p>
            <p className="text-xs text-gray-600">Reporter: @{report.reporterUsername}</p>
            <p className="text-xs text-gray-600">Reason: {report.reason ? truncate(report.reason, 140) : "-"}</p>

            <ReportModerationActions report={report} onResolved={onResolved} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdminOverviewSection({
  overview,
}: {
  overview: AdminDashboardClientProps["initialOverview"];
}) {
  const statCards = [
    { label: "Total users", value: overview.totals.totalUsers },
    { label: "Total posts", value: overview.totals.totalPosts },
    { label: "Total comments", value: overview.totals.totalComments },
    { label: "Total likes", value: overview.totals.totalLikes },
    { label: "Active reports", value: overview.totals.activeReports },
    { label: "Banned users", value: overview.totals.bannedUsers },
  ];

  return (
    <section className="space-y-6" aria-label="Admin analytics overview">
      <h2 className="font-heading text-2xl text-gray-900">Overview</h2>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <article key={card.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-gray-600 uppercase">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityList title="New registrations" points={overview.activity.registrations} />
        <ActivityList title="New posts" points={overview.activity.posts} />
        <ActivityList title="New comments" points={overview.activity.comments} />
        <ActivityList title="New reports" points={overview.activity.reports} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="Top liked posts"
          entries={overview.topContent.mostLikedPosts}
          emptyLabel="No likes yet."
        />
        <RankedList
          title="Top commented posts"
          entries={overview.topContent.mostCommentedPosts}
          emptyLabel="No comments yet."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="Most active authors"
          entries={overview.engagement.mostActiveAuthors}
          emptyLabel="No author activity yet."
        />
        <RankedList
          title="Most active commenters"
          entries={overview.engagement.mostActiveCommenters}
          emptyLabel="No commenter activity yet."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LocationList title="Top countries" entries={overview.geography.topCountries} emptyLabel="No country data yet." />
        <LocationList title="Top cities" entries={overview.geography.topCities} emptyLabel="No city data yet." />
      </div>
    </section>
  );
}

export function AdminDashboardClient({ initialOverview, initialReports }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");
  const [reports, setReports] = useState(initialReports);

  const tabCounts = useMemo(
    () => ({
      reports: reports.length,
    }),
    [reports.length],
  );

  function handleResolved(reportId: string) {
    setReports((previous) => previous.filter((report) => report.id !== reportId));
  }

  return (
    <section className="space-y-4">
      <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            activeTab === "reports" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Reports ({tabCounts.reports})
        </button>
      </div>

      {activeTab === "overview" ? (
        <AdminOverviewSection overview={initialOverview} />
      ) : (
        <ReportQueueSection reports={reports} onResolved={handleResolved} />
      )}
    </section>
  );
}
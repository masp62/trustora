"use client";

import { useMemo, useState, useTransition } from "react";

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

export function AdminDashboardClient({ initialReports }: AdminDashboardClientProps) {
  const [reports, setReports] = useState(initialReports);

  const hasReports = reports.length > 0;

  const pendingCountLabel = useMemo(() => {
    if (reports.length === 1) {
      return "1 pending report";
    }
    return `${reports.length} pending reports`;
  }, [reports.length]);

  function handleResolved(reportId: string) {
    setReports((previous) => previous.filter((report) => report.id !== reportId));
  }

  if (!hasReports) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm font-semibold text-gray-700">No pending reports. Moderation queue is clear.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Pending report queue">
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
                  <ReportModerationActions report={report} onResolved={handleResolved} />
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

            <ReportModerationActions report={report} onResolved={handleResolved} />
          </li>
        ))}
      </ul>
    </section>
  );
}
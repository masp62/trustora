"use client";

import { useId, useState, useTransition } from "react";

import { submitTargetReport } from "@/lib/report-actions";

type ReportTargetButtonProps = {
  targetType: "post" | "comment";
  targetId: string;
  isAuthenticated: boolean;
  className?: string;
};

export function ReportTargetButton({
  targetType,
  targetId,
  isAuthenticated,
  className,
}: ReportTargetButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const reasonId = useId();

  if (!isAuthenticated) {
    return null;
  }

  function handleSubmit() {
    if (isPending) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await submitTargetReport({
        targetType,
        targetId,
        reason,
      });

      if (!result.ok) {
        if (result.error === "VALIDATION") {
          setMessage(result.message);
          return;
        }

        if (result.error === "AUTH_REQUIRED") {
          setMessage("Please sign in to report content.");
          return;
        }

        setMessage("Could not submit report. Please try again.");
        return;
      }

      setMessage(result.message);
      setReason("");
      setIsFormOpen(false);
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          setIsFormOpen((current) => !current);
          setMessage(null);
        }}
        className="touch-target px-2 text-xs font-semibold text-gray-600 transition hover:text-red-600"
      >
        Report
      </button>

      {isFormOpen && (
        <div className="mt-2 space-y-2 rounded-lg border border-red-200 bg-red-50/60 p-3">
          <label htmlFor={reasonId} className="block text-xs font-semibold text-red-900">
            Reason (optional)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            maxLength={1000}
            rows={3}
            placeholder={`Tell us why this ${targetType} should be reviewed.`}
            className="w-full rounded-md border border-red-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
              }}
              className="touch-target rounded-full px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="touch-target rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Submit report
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="mt-2 text-xs text-gray-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
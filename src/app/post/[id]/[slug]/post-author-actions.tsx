"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, SendHorizontal, Trash2 } from "lucide-react";

import { deleteExperiencePost, publishDraftExperiencePost } from "@/lib/post-actions";

type PostAuthorActionsProps = {
  postId: string;
  status: "draft" | "published";
};

export function PostAuthorActions({ postId, status }: PostAuthorActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExperiencePost(postId);
      if (result?.error) {
        setError(result.error);
        setShowConfirm(false);
      }
      // On success, the server action redirects
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishDraftExperiencePost(postId);
      if (result?.error) {
        setError(result.error);
      }
      // On success, the server action redirects
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {status === "draft" && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" />
            {isPending ? "Publishing..." : "Publish now"}
          </button>
        )}
        <Link
          href={`/post/${postId}/edit`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Confirm deletion">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-heading text-xl text-gray-900">Delete this post?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone. Your post and all associated photos, likes, and comments will be permanently removed.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

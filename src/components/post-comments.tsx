"use client";

import Link from "next/link";
import { type FocusEvent, type FormEvent, useState, useTransition } from "react";

import { addPostComment, deletePostComment } from "@/lib/comment-actions";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ReportTargetButton } from "@/components/report-target-button";

type PostCommentsProps = {
  postId: string;
  initialComments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    } | null;
  }>;
  currentUserId: string | null;
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PostComments({
  postId,
  initialComments,
  currentUserId,
  isAuthenticated,
  googleAuthConfigured,
}: PostCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAuthDialog() {
    setAuthDialogOpen(true);
  }

  function handleGuestInputFocus(event: FocusEvent<HTMLTextAreaElement>) {
    if (isAuthenticated) {
      return;
    }

    event.currentTarget.blur();
    openAuthDialog();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      openAuthDialog();
      return;
    }

    if (isPending) {
      return;
    }

    const trimmedComment = commentBody.trim();
    if (!trimmedComment) {
      setErrorMessage("Comment cannot be empty.");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = await addPostComment(postId, commentBody);

      if (!result.ok) {
        if (result.error === "AUTH_REQUIRED") {
          openAuthDialog();
          return;
        }

        if (result.error === "VALIDATION") {
          setErrorMessage(result.message);
          return;
        }

        if (result.error === "BANNED") {
          setErrorMessage(result.message);
          return;
        }

        setErrorMessage("Could not post comment. Please try again.");
        return;
      }

      setComments((previous) => [result.comment, ...previous]);
      setCommentBody("");
      setErrorMessage(null);
    });
  }

  function handleDelete(commentId: string) {
    if (deletingCommentId) {
      return;
    }

    setDeletingCommentId(commentId);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await deletePostComment(commentId);

      if (!result.ok) {
        if (result.error === "AUTH_REQUIRED") {
          openAuthDialog();
        } else {
          setErrorMessage("Could not delete comment. Please try again.");
        }
        setDeletingCommentId(null);
        return;
      }

      setComments((previous) => previous.filter((entry) => entry.id !== commentId));
      setDeletingCommentId(null);
    });
  }

  return (
    <section className="space-y-4" aria-label="Comments">
      <h2 className="font-heading text-2xl text-gray-900">Comments ({comments.length})</h2>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor="comment-body" className="text-sm font-semibold text-gray-800">
          Write a comment
        </label>
        <textarea
          id="comment-body"
          name="commentBody"
          value={commentBody}
          onChange={(event) => setCommentBody(event.currentTarget.value)}
          onFocus={handleGuestInputFocus}
          onClick={() => {
            if (!isAuthenticated) {
              openAuthDialog();
            }
          }}
          rows={3}
          maxLength={2000}
          placeholder={isAuthenticated ? "Share your experience..." : "Sign in to leave a comment"}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          aria-invalid={errorMessage ? "true" : "false"}
          aria-describedby={errorMessage ? "comment-error" : undefined}
        />

        {errorMessage && (
          <p id="comment-error" className="text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            Post comment
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No comments yet.</p>
      ) : (
        <ul className="space-y-3" aria-label="Comment list">
          {comments.map((comment) => {
            const canDelete = isAuthenticated && currentUserId === comment.author?.id;
            const isDeleting = deletingCommentId === comment.id;

            return (
              <li key={comment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  {comment.author ? (
                    <Link
                      href={`/u/${comment.author.username}`}
                      className="text-sm font-semibold text-gray-800 hover:text-brand"
                    >
                      {comment.author.displayName} (@{comment.author.username})
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">Deleted user</span>
                  )}

                  <div className="flex items-center gap-3">
                    <time className="text-xs text-gray-500">{formatDate(comment.createdAt)}</time>
                    {isAuthenticated && (
                      <ReportTargetButton
                        targetType="comment"
                        targetId={comment.id}
                        isAuthenticated={isAuthenticated}
                      />
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        className="text-xs font-semibold text-gray-600 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Delete comment
                      </button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{comment.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {!isAuthenticated && (
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          googleAuthConfigured={googleAuthConfigured}
        />
      )}
    </section>
  );
}
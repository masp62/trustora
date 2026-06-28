"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { setPostLikeStatus } from "@/lib/like-actions";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { cn } from "@/lib/utils";

type PostLikeButtonProps = {
  postId: string;
  initialLikeCount: number;
  initiallyLiked: boolean;
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
  compact?: boolean;
};

export function PostLikeButton({
  postId,
  initialLikeCount,
  initiallyLiked,
  isAuthenticated,
  googleAuthConfigured,
  compact = false,
}: PostLikeButtonProps) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleLike() {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    if (isPending) {
      return;
    }

    const nextLiked = !liked;
    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(nextLiked);
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

    startTransition(async () => {
      try {
        const result = await setPostLikeStatus(postId, nextLiked);

        if (!result.ok) {
          setLiked(previousLiked);
          setLikeCount(previousCount);

          if (result.error === "AUTH_REQUIRED") {
            setAuthDialogOpen(true);
          }
          return;
        }

        setLiked(result.liked);
        setLikeCount(result.likeCount);
      } catch {
        setLiked(previousLiked);
        setLikeCount(previousCount);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleLike}
        disabled={isPending}
        aria-pressed={liked}
        aria-label={liked ? "Unlike this post" : "Like this post"}
        className={cn(
          "touch-target inline-flex items-center gap-1 rounded-full border border-transparent transition",
          compact ? "px-2.5 py-2 text-sm" : "px-3 py-2 text-sm font-medium",
          liked ? "text-rose-600 hover:bg-rose-50" : "text-gray-600 hover:bg-gray-100",
          isPending && "opacity-70",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
        <span>{likeCount}</span>
      </button>

      {!isAuthenticated && (
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          googleAuthConfigured={googleAuthConfigured}
        />
      )}
    </>
  );
}
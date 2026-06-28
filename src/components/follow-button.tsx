"use client";

import { useState, useTransition } from "react";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { setFollowStatus } from "@/lib/follow-actions";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  targetUserId: string;
  targetUsername: string;
  initiallyFollowing: boolean;
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
  className?: string;
};

export function FollowButton({
  targetUserId,
  targetUsername,
  initiallyFollowing,
  isAuthenticated,
  googleAuthConfigured,
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleFollow() {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    if (isPending) {
      return;
    }

    const nextIsFollowing = !isFollowing;
    const previousIsFollowing = isFollowing;
    setIsFollowing(nextIsFollowing);

    startTransition(async () => {
      try {
        const result = await setFollowStatus(targetUserId, nextIsFollowing);

        if (!result.ok) {
          setIsFollowing(previousIsFollowing);

          if (result.error === "AUTH_REQUIRED") {
            setAuthDialogOpen(true);
          }
          return;
        }

        setIsFollowing(result.followed);
      } catch {
        setIsFollowing(previousIsFollowing);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleFollow}
        disabled={isPending}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? `Unfollow @${targetUsername}` : `Follow @${targetUsername}`}
        className={cn(
          "touch-target rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-70",
          isFollowing
            ? "border border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-100"
            : "border border-gray-900 bg-gray-900 text-white hover:bg-gray-700",
          className,
        )}
      >
        {isFollowing ? "Following" : "Follow"}
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

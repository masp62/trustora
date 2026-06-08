"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const ONBOARDING_PROMPT_DISMISSED_KEY = "realbnb.onboardingPrompt.dismissed";

export function OnboardingPrompt() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const shouldShowPrompt = searchParams.get("onboarding") === "1";
  const persistedDismissed =
    typeof window !== "undefined" &&
    window.localStorage.getItem(ONBOARDING_PROMPT_DISMISSED_KEY) === "1";

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_PROMPT_DISMISSED_KEY, "1");
    }

    setDismissed(true);
  }

  if (!shouldShowPrompt || dismissed || persistedDismissed) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Welcome to RealBnB.</p>
          <p className="mt-1 text-sm">Try following travelers or create your first post to get started.</p>
        </div>
        <Link
          href="/explore"
          onClick={handleDismiss}
          className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold uppercase transition hover:bg-amber-100"
        >
          Dismiss
        </Link>
      </div>
    </div>
  );
}

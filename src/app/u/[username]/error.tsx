"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV === "development") {
    console.error("[ProfileError]", error);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <AlertTriangle className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-xl font-semibold text-gray-900">
        Profile could not be loaded
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-gray-600">
        We couldn&apos;t load this traveler&apos;s profile. Please try again.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Try again
        </button>
        <Link
          href="/explore"
          className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back to Explore
        </Link>
      </div>
    </main>
  );
}

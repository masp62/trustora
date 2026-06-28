import Link from "next/link";
import { Compass, SearchX, UserPlus } from "lucide-react";

/**
 * Shown on the Explore page when active filters return zero results.
 */
export function ExploreNoResults() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
      <div className="relative flex size-16 items-center justify-center rounded-full bg-gray-100">
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand/20" aria-hidden="true" />
        <SearchX className="size-8 text-gray-400" />
      </div>
      <h2 className="mt-5 font-heading text-xl text-gray-900">
        No stories match your filters
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Try adjusting your filters or clearing them to see all travel
        experiences.
      </p>
    </div>
  );
}

/**
 * Shown on the Home feed when the user doesn't follow anyone yet.
 */
export function HomeFeedEmpty() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand/10">
        <UserPlus className="size-8 text-brand" />
      </div>
      <h2 className="mt-5 font-heading text-xl text-gray-900">
        Your feed is empty
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        No stories shared yet. Your next adventure starts here.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          <Compass className="size-4" />
          Browse /explore
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <UserPlus className="size-4" />
          Discover travelers
        </Link>
      </div>
    </div>
  );
}

/**
 * Shown on the Explore page when there are no posts at all.
 */
export function ExploreEmpty() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
      <div className="relative flex size-16 items-center justify-center rounded-full bg-brand/10">
        <span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-brand/30" aria-hidden="true" />
        <Compass className="size-8 text-brand" />
      </div>
      <h2 className="mt-5 font-heading text-xl text-gray-900">
        No stories shared yet
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Your next adventure starts here.
      </p>
    </div>
  );
}

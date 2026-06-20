import { Suspense } from "react";

import { auth, googleAuthConfigured } from "@/auth";
import { FilterPanel } from "@/components/explore/filter-panel";
import { parseFiltersFromParams } from "@/lib/explore-filters";
import { getExplorePostsPage } from "@/lib/explore-feed";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";
import { ExploreFeedClient } from "./explore-feed-client";

interface ExploreSearchParams {
  country?: string;
  city?: string;
  tripType?: string;
  tags?: string;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;
  const sp = new URLSearchParams();
  if (params.country) sp.set("country", params.country);
  if (params.city) sp.set("city", params.city);
  if (params.tripType) sp.set("tripType", params.tripType);
  if (params.tags) sp.set("tags", params.tags);

  const filters = parseFiltersFromParams(sp);
  const hasActiveFilters =
    !!filters.country ||
    !!filters.city ||
    !!filters.tripType ||
    filters.tags.length > 0;
  const feedKey = JSON.stringify(filters);

  const { posts, hasMore, nextCursor } = await getExplorePostsPage(
    session?.user?.id ?? null,
    filters,
  );
  const isAuthenticated = !!session?.user;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      {/* Hero + Filters */}
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Explore</p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-gray-900 sm:text-6xl xl:max-w-none xl:whitespace-nowrap">
          Discover real travel stay stories.
        </h1>

        <OnboardingPrompt />

        {session?.user && (
          <>
            <Suspense>
              <ProfileSetupDialog
                initialDisplayName={session.user.name ?? ""}
                initialBio=""
                initialLocation=""
              />
            </Suspense>
          </>
        )}

        <div className="mt-6 border-t border-gray-100 pt-4">
          <Suspense>
            <FilterPanel />
          </Suspense>
        </div>
      </section>

      {/* Post Feed */}
      <section className="mx-auto w-full max-w-[1760px]">
        <ExploreFeedClient
          key={feedKey}
          initialPosts={posts}
          initialHasMore={hasMore}
          initialNextCursor={nextCursor}
          isAuthenticated={isAuthenticated}
          googleAuthConfigured={googleAuthConfigured}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
        />
      </section>
    </main>
  );
}

import { auth } from "@/auth";
import { AccommodationCard } from "@/components/accommodation-card";
import { FilterPanel } from "@/components/explore/filter-panel";
import { getAccommodationCards } from "@/lib/accommodations";
import { parseFiltersFromParams } from "@/lib/explore-filters";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }

  const filters = parseFiltersFromParams(params);
  const accommodations = await getAccommodationCards(filters);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      {/* Hero + Filters */}
      <section className="mx-auto mb-10 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:mb-12 sm:p-8">
        <p className="motion-hero-kicker text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Explore</p>
        <h1 className="motion-hero-title mt-3 max-w-2xl font-heading text-4xl leading-tight text-gray-900 sm:text-6xl xl:max-w-none xl:whitespace-nowrap">
          Discover verified accommodations.
        </h1>
        <p className="motion-hero-subtitle mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
          Find your next stay through traveler stories with transparent ratings and context.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
          <FilterPanel />
        </div>

        <OnboardingPrompt />

        {session?.user && (
          <>
            <ProfileSetupDialog
              initialDisplayName={session.user.name ?? ""}
              initialBio=""
              initialLocation=""
            />
          </>
        )}
      </section>

      {/* Accommodation Feed */}
      <section className="mx-auto w-full max-w-[1760px]">
        {accommodations.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="font-heading text-2xl text-gray-900">No accommodations yet</h2>
            <p className="mt-2 text-sm text-gray-600">Create an experience with property details to populate this list.</p>
          </div>
        ) : (
          <div className="stagger-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} accommodation={accommodation} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { auth } from "@/auth";
import { AccommodationCard } from "@/components/accommodation-card";
import { getAccommodationCards } from "@/lib/accommodations";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

export default async function ExplorePage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const accommodations = await getAccommodationCards();

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      {/* Hero + Filters */}
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Explore</p>
        <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight text-gray-900 sm:text-6xl xl:max-w-none xl:whitespace-nowrap">
          Discover verified accommodations.
        </h1>

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} accommodation={accommodation} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

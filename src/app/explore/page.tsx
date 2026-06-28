import type { Metadata } from "next";

import { auth } from "@/auth";
import { AccommodationCard } from "@/components/accommodation-card";
import { FilterPanel } from "@/components/explore/filter-panel";
import { getAccommodationCards } from "@/lib/accommodations";
import { parseFiltersFromParams } from "@/lib/explore-filters";
import { toOpenGraphImages } from "@/lib/seo";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

type ExplorePageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function getResolvedParams(searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }

  return params;
}

function buildExploreCanonicalUrl(params: URLSearchParams) {
  const canonicalParams = new URLSearchParams();

  const country = params.get("country")?.trim() ?? "";
  const city = params.get("city")?.trim() ?? "";
  const tripType = params.get("tripType")?.trim() ?? "";
  const tags = params.get("tags")?.trim() ?? "";

  if (country) {
    canonicalParams.set("country", country);
  }

  if (city) {
    canonicalParams.set("city", city);
  }

  if (tripType) {
    canonicalParams.set("tripType", tripType);
  }

  if (tags) {
    canonicalParams.set("tags", tags);
  }

  const query = canonicalParams.toString();
  return query ? `/explore?${query}` : "/explore";
}

function buildExploreTitle(filters: { country: string; city: string; tripType: string; tags: string[] }) {
  const locationPart = filters.city && filters.country
    ? ` in ${filters.city}, ${filters.country}`
    : filters.country
      ? ` in ${filters.country}`
      : "";

  const tripTypePart = filters.tripType ? ` for ${filters.tripType} travelers` : "";
  const tagPart = filters.tags.length > 0 ? ` tagged ${filters.tags.join(", ")}` : "";

  return `Explore accommodations${locationPart}${tripTypePart}${tagPart} - Trustora`;
}

export async function generateMetadata({ searchParams }: ExplorePageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const params = getResolvedParams(resolvedSearchParams);
  const filters = parseFiltersFromParams(params);
  const accommodations = await getAccommodationCards(filters);

  const title = buildExploreTitle(filters);
  const description = accommodations.length > 0
    ? `Browse ${accommodations.length} traveler-reviewed accommodations on Trustora.`
    : "Browse traveler-reviewed accommodations on Trustora.";
  const url = buildExploreCanonicalUrl(params);
  const openGraphImage = accommodations[0]?.leadImageUrl ?? null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: toOpenGraphImages(openGraphImage, title),
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const params = getResolvedParams(resolvedSearchParams);

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

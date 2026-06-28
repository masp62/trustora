import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth, googleAuthConfigured } from "@/auth";
import { PostCard } from "@/components/post-card";
import { getLocationPosts, resolveCityFromSlug, resolveCountryFromSlug } from "@/lib/location-feed";
import { locationToSlug } from "@/lib/location-slug";

type CityPageProps = {
  params: Promise<{ country: string; city: string }>;
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { country: countrySlug, city: citySlug } = await params;
  const country = await resolveCountryFromSlug(countrySlug);

  if (!country) {
    return {
      title: "Location not found",
      description: "No travel experiences found for this location.",
    };
  }

  const city = await resolveCityFromSlug(country, citySlug);
  if (!city) {
    return {
      title: "Location not found",
      description: "No travel experiences found for this location.",
    };
  }

  const title = `Experiences in ${city}, ${country}`;
  const description = `Browse real travel stay experiences in ${city}, ${country} on Trustora.`;
  const url = `/explore/${countrySlug}/${citySlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function CityExplorePage({ params }: CityPageProps) {
  const { country: countrySlug, city: citySlug } = await params;
  const country = await resolveCountryFromSlug(countrySlug);

  if (!country) {
    notFound();
  }

  const city = await resolveCityFromSlug(country, citySlug);
  if (!city) {
    notFound();
  }

  const session = await auth();
  const posts = await getLocationPosts(session?.user?.id ?? null, country, city);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Location</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">
          Experiences in {city}, {country}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Discover neighborhood-level stories from {city}.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1760px]">
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/explore" className="font-medium text-brand hover:text-brand-hover">
            Explore
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href={`/explore/${countrySlug}`} className="font-medium text-brand hover:text-brand-hover">
            {locationToSlug(country)}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span>{locationToSlug(city)}</span>
        </div>

        <div className="stagger-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthenticated={!!session?.user}
              googleAuthConfigured={googleAuthConfigured}
            />
          ))}
        </div>
      </section>
    </main>
  );
}


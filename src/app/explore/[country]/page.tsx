import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth, googleAuthConfigured } from "@/auth";
import { PostCard } from "@/components/post-card";
import { resolveCountryFromSlug, getLocationPosts } from "@/lib/location-feed";
import { locationToSlug } from "@/lib/location-slug";

type CountryPageProps = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const country = await resolveCountryFromSlug(countrySlug);

  if (!country) {
    return {
      title: "Location not found",
      description: "No travel experiences found for this location.",
    };
  }

  const title = `Experiences in ${country}`;
  const description = `Browse real travel stay experiences in ${country} on RealBnB.`;
  const url = `/explore/${countrySlug}`;

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

export default async function CountryExplorePage({ params }: CountryPageProps) {
  const { country: countrySlug } = await params;
  const country = await resolveCountryFromSlug(countrySlug);

  if (!country) {
    notFound();
  }

  const session = await auth();
  const posts = await getLocationPosts(session?.user?.id ?? null, country);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Location</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">
          Experiences in {country}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Explore stories from cities across {country}.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1760px]">
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/explore" className="font-medium text-brand hover:text-brand-hover">
            Explore
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span>{locationToSlug(country)}</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

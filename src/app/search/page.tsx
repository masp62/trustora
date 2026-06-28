import type { Metadata } from "next";

import { auth, googleAuthConfigured } from "@/auth";
import { PostCard } from "@/components/post-card";
import { searchPosts } from "@/lib/search-feed";
import { getLatestPublicOgImage, toOpenGraphImages } from "@/lib/seo";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function normalizeQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = normalizeQuery(params.q);

  if (!query) {
    const fallbackImage = await getLatestPublicOgImage();

    return {
      title: "Search experiences - Trustora",
      description: "Search travel stay experiences on Trustora.",
      openGraph: {
        title: "Search experiences - Trustora",
        description: "Search travel stay experiences on Trustora.",
        type: "website",
        url: "/search",
        images: toOpenGraphImages(fallbackImage, "Search experiences - Trustora"),
      },
      alternates: {
        canonical: "/search",
      },
    };
  }

  const posts = await searchPosts(null, query);
  const fallbackImage = await getLatestPublicOgImage();
  const openGraphImage = posts[0]?.leadImageUrl ?? fallbackImage;
  const title = `Search results for \"${query}\" - Trustora`;
  const description = `Discover travel stay experiences matching \"${query}\" on Trustora.`;
  const url = `/search?q=${encodeURIComponent(query)}`;

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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  const params = await searchParams;
  const query = normalizeQuery(params.q);

  const posts = query ? await searchPosts(session?.user?.id ?? null, query) : [];

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Search</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">
          {query ? `Search results for \"${query}\"` : "Search travel stories"}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Find experiences by title, story text, city, or country.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1760px]">
        {!query ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="font-heading text-2xl text-gray-900">Start typing in the search bar</h2>
            <p className="mt-2 text-sm text-gray-600">Use the top navigation to search for stories.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="font-heading text-2xl text-gray-900">No results found</h2>
            <p className="mt-2 text-sm text-gray-600">
              We could not find stories matching &quot;{query}&quot;.
            </p>
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}


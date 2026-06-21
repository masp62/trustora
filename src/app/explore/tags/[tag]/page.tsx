import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth, googleAuthConfigured } from "@/auth";
import { PostCard } from "@/components/post-card";
import { getTagPosts, isValidPredefinedTag, tagToLabel } from "@/lib/tag-feed";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;

  if (!isValidPredefinedTag(tag)) {
    return {
      title: "Tag not found",
      description: "This tag does not exist on Trustora.",
    };
  }

  const tagLabel = tagToLabel(tag);
  const title = `${tagLabel} Experiences â€” Trustora`;
  const description = `Browse ${tagLabel.toLowerCase()} travel stay experiences shared by the Trustora community.`;
  const url = `/explore/tags/${tag}`;

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

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;

  if (!isValidPredefinedTag(tag)) {
    notFound();
  }

  const session = await auth();
  const posts = await getTagPosts(session?.user?.id ?? null, tag);
  const tagLabel = tagToLabel(tag);

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Tag</p>
        <h1 className="mt-3 font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">
          {tagLabel} Experiences
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Discover stories tagged with {tagLabel.toLowerCase()}.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1760px]">
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/explore" className="font-medium text-brand hover:text-brand-hover">
            Explore
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span>tags</span>
          <span className="mx-2 text-gray-400">/</span>
          <span>{tag}</span>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <h2 className="font-heading text-2xl text-gray-900">No stories yet for {tagLabel}</h2>
            <p className="mt-2 text-sm text-gray-600">Check back later for new tagged experiences.</p>
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}


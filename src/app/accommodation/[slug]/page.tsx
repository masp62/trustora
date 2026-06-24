import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Star } from "lucide-react";

import { auth, googleAuthConfigured } from "@/auth";
import { PostComments } from "@/components/post-comments";
import { getAccommodationDetailBySlug } from "@/lib/accommodations";

type AccommodationPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export async function generateMetadata({ params }: AccommodationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const accommodation = await getAccommodationDetailBySlug(slug);

  if (!accommodation) {
    return {
      title: "Accommodation not found",
    };
  }

  return {
    title: `${accommodation.name} · ${accommodation.locationCity}, ${accommodation.locationCountry}`,
    description: `Accommodation overview with ${accommodation.posts.length} experience stories and aggregated rating.`,
  };
}

export default async function AccommodationPage({ params }: AccommodationPageProps) {
  const { slug } = await params;
  const accommodation = await getAccommodationDetailBySlug(slug);

  if (!accommodation) {
    notFound();
  }

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] space-y-8">
        <header className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Accommodation</p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">{accommodation.name}</h1>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="size-4 text-brand-accent" />
            {accommodation.locationCity}, {accommodation.locationCountry}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Weighted score</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {typeof accommodation.weightedOverallScore === "number" ? accommodation.weightedOverallScore.toFixed(1) : "-"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Contributing ratings</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{accommodation.contributingRatingCount}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Experience posts</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{accommodation.posts.length}</p>
            </div>
          </div>
        </header>

        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-3xl text-gray-900">Experiences</h2>
          <p className="mt-2 text-sm text-gray-600">Newest first. Click any story for full details.</p>

          {accommodation.posts.length === 0 ? (
            <p className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No experience stories yet.</p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {accommodation.posts.map((post) => (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <Link href={`/post/${post.id}/${post.slug}`} className="block">
                    {post.leadImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.leadImageUrl}
                        alt={post.title}
                        className="h-64 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-64 w-full items-center justify-center bg-gray-50">
                        <MapPin className="size-10 text-gray-300" />
                      </div>
                    )}
                  </Link>
                  <div className="space-y-3 p-4">
                    <Link href={`/post/${post.id}/${post.slug}`} className="block">
                      <h3 className="line-clamp-2 font-heading text-xl leading-tight text-gray-900 transition hover:text-brand">{post.title}</h3>
                    </Link>
                    <p className="line-clamp-3 text-sm leading-6 text-gray-700">{post.excerpt}</p>
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {formatDate(post.createdAt)}
                      </span>
                      {typeof post.individualRating === "number" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                          <Star className="size-3 fill-amber-400 text-amber-500" />
                          {post.individualRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {accommodation.anchorPostId && (
          <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <PostComments
              postId={accommodation.anchorPostId}
              currentUserId={currentUserId}
              isAuthenticated={!!session?.user}
              googleAuthConfigured={googleAuthConfigured}
              initialComments={accommodation.comments.map((comment) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt.toISOString(),
                author: comment.author,
              }))}
            />
          </section>
        )}
      </section>
    </main>
  );
}

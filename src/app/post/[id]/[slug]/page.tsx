import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Star } from "lucide-react";

import { auth, googleAuthConfigured } from "@/auth";
import { getPostDetailById, postCanonicalPath } from "@/app/post/post-detail-data";
import { ACCOMMODATION_RATING_CATEGORIES } from "@/lib/accommodation-rating-categories";
import { FollowButton } from "@/components/follow-button";
import { PostComments } from "@/components/post-comments";
import { PostLikeButton } from "@/components/post-like-button";
import { ReportTargetButton } from "@/components/report-target-button";
import { db } from "@/lib/db";

import { PhotoGallery } from "./photo-gallery";
import { PostAuthorActions } from "./post-author-actions";

type PostDetailPageProps = {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ published?: string }>;
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { id, slug } = await params;
  const session = await auth();
  const post = await getPostDetailById(id, session?.user?.id ?? null);

  if (!post) {
    return {
      title: "Post not found",
      description: "The requested Trustora post does not exist.",
    };
  }

  if (slug !== post.slug) {
    permanentRedirect(postCanonicalPath(post.id, post.slug));
  }

  const description = `${post.body.slice(0, 140)}${post.body.length > 140 ? "..." : ""}`;
  const canonicalUrl = postCanonicalPath(post.id, post.slug);
  const openGraphImages = post.images.map((image) => ({
    url: image.cloudinaryUrl,
    alt: post.title,
  }));

  return {
    title: `${post.title} · ${post.locationCity}, ${post.locationCountry}`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: canonicalUrl,
      images: openGraphImages,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PostDetailPage({ params, searchParams }: PostDetailPageProps) {
  const { id, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const showPublishedNotice = resolvedSearchParams.published === "1";
  const session = await auth();
  const post = await getPostDetailById(id, session?.user?.id ?? null);

  if (!post) {
    notFound();
  }

  if (slug !== post.slug) {
    permanentRedirect(postCanonicalPath(post.id, post.slug));
  }

  const currentUserId = session?.user?.id ?? null;
  const isAuthor = session?.user?.id === post.authorId;
  const currentUserFollowCount = currentUserId
    ? await db.follow.count({
        where: {
          followerId: currentUserId,
          followingId: post.authorId,
        },
      })
    : 0;
  const likeCount = await db.like.count({ where: { postId: post.id } });
  const userLikeCount = session?.user?.id
    ? await db.like.count({ where: { postId: post.id, userId: session.user.id } })
    : 0;
  const authorRating = (await db.accommodationRating.findMany({
    where: { postId: post.id, userId: post.authorId },
    take: 1,
    select: {
      overallScore: true,
      cleanliness: true,
      accuracy: true,
      checkIn: true,
      communication: true,
      location: true,
      value: true,
      comfort: true,
      facilities: true,
    },
  })) as Array<{
    overallScore: number;
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
    comfort: number;
    facilities: number;
  }>;
  const creatorOverall =
    authorRating.length > 0
      ? Number(
          (
            (authorRating[0].cleanliness +
              authorRating[0].accuracy +
              authorRating[0].checkIn +
              authorRating[0].communication +
              authorRating[0].location +
              authorRating[0].value +
              authorRating[0].comfort +
              authorRating[0].facilities) /
            8
          ).toFixed(1),
        )
      : null;
  const creatorStars = creatorOverall !== null ? Math.max(1, Math.min(5, Math.round(creatorOverall))) : null;

  return (
    <main className="flex flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 sm:py-12">
      <article className="mx-auto w-full max-w-[1760px] space-y-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        {showPublishedNotice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Published! Your story is now visible to travelers.
          </div>
        )}
        <header className="space-y-3">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-[0.16em] text-gray-500 uppercase">Experience</p>
              {isAuthor && post.status === "draft" && (
                <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  Draft
                </span>
              )}
              {isAuthor && post.status === "published" && post.visibility === "private" && (
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Private
                </span>
              )}
            </div>
            {isAuthor && <PostAuthorActions postId={post.id} status={post.status} visibility={post.visibility} />}
          </div>
          <h1 className="font-heading text-3xl leading-tight text-gray-900 sm:text-5xl">{post.title}</h1>
          <p className="text-sm text-gray-600">
            {post.locationCity}, {post.locationCountry} · {toTitleCase(post.tripType)}
          </p>
          {post.propertyName && <p className="text-sm text-gray-600">Property: {post.propertyName}</p>}
        </header>

        <PhotoGallery title={post.title} images={post.images} />

        <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/u/${post.author.username}`} className="inline-flex items-center gap-3">
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.displayName}
                  className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700">
                  {post.author.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{post.author.displayName}</p>
                <p className="text-sm text-gray-600">@{post.author.username}</p>
              </div>
            </Link>

            {!isAuthor && (
              <FollowButton
                targetUserId={post.authorId}
                targetUsername={post.author.username}
                initiallyFollowing={currentUserFollowCount > 0}
                isAuthenticated={!!session?.user}
                googleAuthConfigured={googleAuthConfigured}
                className="px-5"
              />
            )}
          </div>
        </section>

        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Tags">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold tracking-wide text-gray-700"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <section className="space-y-3">
          <h2 className="font-heading text-2xl text-gray-900">Story</h2>
          <p className="whitespace-pre-wrap text-[1.05rem] leading-8 text-gray-800">{post.body}</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5" aria-label="Parent accommodation">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Accommodation</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{post.accommodation.name}</p>
              <p className="text-sm text-gray-600">
                Aggregated score: {typeof post.accommodation.weightedOverallScore === "number" ? post.accommodation.weightedOverallScore.toFixed(1) : "-"}
              </p>
            </div>
            <Link
              href={`/accommodation/${post.accommodation.slug}`}
              className="touch-target inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              View accommodation
            </Link>
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-gray-200 p-4 sm:p-5" aria-label="Post stats">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">Likes</p>
            <PostLikeButton
              postId={post.id}
              initialLikeCount={likeCount}
              initiallyLiked={userLikeCount > 0}
              isAuthenticated={!!session?.user}
              googleAuthConfigured={googleAuthConfigured}
            />
          </div>
          {session?.user?.id && (
            <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
              <p className="text-sm font-semibold text-gray-700">Safety</p>
              <ReportTargetButton targetType="post" targetId={post.id} isAuthenticated />
            </div>
          )}
          {post.status === "published" ? (
            <p className="text-sm text-gray-600">Published {formatDate(post.publishedAt ?? post.createdAt)}</p>
          ) : (
            <p className="text-sm text-amber-700">Draft not published yet.</p>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-gray-200 p-4 sm:p-5" aria-label="Accommodation rating by story creator">
          <h2 className="font-heading text-2xl text-gray-900">Accommodation rating</h2>
          <p className="text-sm text-gray-600">Rated by the story creator as part of publishing this experience.</p>
          {creatorStars ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
                <div className="flex items-center gap-1" aria-label={`${creatorStars} of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const filled = i < creatorStars;
                    return (
                      <Star
                        key={i}
                        className={`size-5 ${filled ? "fill-amber-400 text-amber-500" : "text-amber-200"}`}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <span className="text-sm font-semibold text-amber-700">{creatorOverall?.toFixed(1)}/5</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2" aria-label="Accommodation category ratings">
                {ACCOMMODATION_RATING_CATEGORIES.map((category) => {
                  const value = authorRating[0][category.key];
                  return (
                    <div
                      key={category.key}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm text-gray-700">{category.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}/5</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No accommodation rating was added for this story.</p>
          )}
        </section>

        <PostComments
          postId={post.id}
          currentUserId={currentUserId}
          isAuthenticated={!!session?.user}
          googleAuthConfigured={googleAuthConfigured}
          initialComments={post.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author: comment.author,
          }))}
        />
      </article>
    </main>
  );
}


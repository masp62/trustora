import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { auth, googleAuthConfigured } from "@/auth";
import { getPostDetailById, postCanonicalPath } from "@/app/post/post-detail-data";
import { PostLikeButton } from "@/components/post-like-button";
import { db } from "@/lib/db";

import { PhotoGallery } from "./photo-gallery";
import { PostAuthorActions } from "./post-author-actions";

type PostDetailPageProps = {
  params: Promise<{ id: string; slug: string }>;
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
  const post = await getPostDetailById(id);

  if (!post) {
    return {
      title: "Post not found",
      description: "The requested RealBnB post does not exist.",
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

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id, slug } = await params;
  const post = await getPostDetailById(id);

  if (!post) {
    notFound();
  }

  if (slug !== post.slug) {
    permanentRedirect(postCanonicalPath(post.id, post.slug));
  }

  const session = await auth();
  const isAuthor = session?.user?.id === post.authorId;
  const likeCount = await db.like.count({ where: { postId: post.id } });
  const userLikeCount = session?.user?.id
    ? await db.like.count({ where: { postId: post.id, userId: session.user.id } })
    : 0;

  return (
    <main className="flex flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 sm:py-12">
      <article className="mx-auto w-full max-w-[1760px] space-y-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.16em] text-gray-500 uppercase">Experience</p>
            {isAuthor && <PostAuthorActions postId={post.id} />}
          </div>
          <h1 className="font-heading text-3xl leading-tight text-gray-900 sm:text-5xl">{post.title}</h1>
          <p className="text-sm text-gray-600">
            {post.locationCity}, {post.locationCountry} · {toTitleCase(post.tripType)}
          </p>
          {post.propertyName && <p className="text-sm text-gray-600">Property: {post.propertyName}</p>}
        </header>

        <PhotoGallery title={post.title} images={post.images} />

        <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
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
          <p className="text-sm text-gray-600">Published {formatDate(post.createdAt)}</p>
        </section>

        <section className="space-y-4" aria-label="Comments">
          <h2 className="font-heading text-2xl text-gray-900">Comments ({post.comments.length})</h2>
          {post.comments.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              No comments yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {post.comments.map((comment) => (
                <li key={comment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    {comment.author ? (
                      <Link href={`/u/${comment.author.username}`} className="text-sm font-semibold text-gray-800 hover:text-brand">
                        {comment.author.displayName} (@{comment.author.username})
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-gray-600">Deleted user</span>
                    )}
                    <time className="text-xs text-gray-500">{formatDate(comment.createdAt)}</time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  );
}

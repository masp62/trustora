"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";

import { PostLikeButton } from "@/components/post-like-button";

export type PostCardData = {
  id: string;
  slug: string;
  title: string;
  locationCity: string;
  locationCountry: string;
  tripType: string;
  leadImageUrl: string | null;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  initiallyLiked: boolean;
  accommodationRating?: number | null;
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type PostCardProps = {
  post: PostCardData;
  isAuthenticated: boolean;
  googleAuthConfigured: boolean;
};

export function PostCard({ post, isAuthenticated, googleAuthConfigured }: PostCardProps) {
  const href = `/post/${post.id}/${post.slug}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <Link href={href} className="block">
          {post.leadImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.leadImageUrl}
              alt={post.title}
              className="h-52 w-full object-cover transition group-hover:scale-[1.02] sm:h-60"
            />
          ) : (
            <div className="flex h-52 w-full items-center justify-center bg-gray-50 sm:h-60">
              <MapPin className="size-10 text-gray-300" />
            </div>
          )}
        </Link>

        <div className="absolute top-3 right-3 z-10">
          <div className="rounded-full bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur">
            <PostLikeButton
              postId={post.id}
              initialLikeCount={post.likeCount}
              initiallyLiked={post.initiallyLiked}
              isAuthenticated={isAuthenticated}
              googleAuthConfigured={googleAuthConfigured}
              compact
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4 sm:p-4">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 font-heading text-lg leading-snug text-gray-900 transition group-hover:text-brand">
            {post.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="size-3.5 text-brand-accent" />
          <span className="truncate">
            {post.locationCity}, {post.locationCountry}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{toTitleCase(post.tripType)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          {typeof post.accommodationRating === "number" ? (
            <div className="flex items-center gap-2 text-sm text-amber-700" aria-label={`Accommodation rating ${post.accommodationRating.toFixed(1)} of 5`}>
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => {
                  const filled = i < Math.round(post.accommodationRating ?? 0);
                  return (
                    <Star
                      key={i}
                      className={`size-3.5 ${filled ? "fill-amber-400 text-amber-500" : "text-amber-200"}`}
                    />
                  );
                })}
              </div>
              <span className="font-medium">{post.accommodationRating.toFixed(1)}/5</span>
            </div>
          ) : (
            <div />
          )}

          <Link
            href={`/u/${post.author.username}`}
            className="touch-target flex max-w-[12rem] items-center gap-2 transition hover:opacity-80"
            aria-label={`View profile of ${post.author.username}`}
          >
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.avatarUrl}
                alt={post.author.displayName}
                className="size-7 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700">
                {post.author.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="truncate text-sm font-medium text-gray-700">
              {post.author.displayName}
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { Heart, MapPin } from "lucide-react";

import { postCanonicalPath } from "@/app/post/post-detail-data";

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
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PostCard({ post }: { post: PostCardData }) {
  const href = postCanonicalPath(post.id, post.slug);

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
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

      <div className="space-y-3 p-4 sm:p-5">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 font-heading text-lg leading-snug text-gray-900 transition group-hover:text-[#E0565B]">
            {post.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="size-3.5 text-[#008489]" />
          <span className="truncate">
            {post.locationCity}, {post.locationCountry}
          </span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{toTitleCase(post.tripType)}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link
            href={`/u/${post.author.username}`}
            className="flex items-center gap-2 transition hover:opacity-80"
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
            <span className="text-sm font-medium text-gray-700">
              {post.author.displayName}
            </span>
          </Link>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Heart className="size-3.5" />
            <span>{post.likeCount}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

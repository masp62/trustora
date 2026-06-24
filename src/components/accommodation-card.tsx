import Link from "next/link";
import { Building2, MapPin, Star } from "lucide-react";

import type { AccommodationCardData } from "@/lib/accommodations";

type AccommodationCardProps = {
  accommodation: AccommodationCardData;
};

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const href = `/accommodation/${accommodation.slug}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={href} className="block">
        {accommodation.leadImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={accommodation.leadImageUrl}
            alt={accommodation.name}
            className="h-52 w-full object-cover transition group-hover:scale-[1.02] sm:h-60"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center bg-gray-50 sm:h-60">
            <Building2 className="size-10 text-gray-300" />
          </div>
        )}
      </Link>

      <div className="space-y-3 p-4">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 font-heading text-lg leading-snug text-gray-900 transition group-hover:text-brand">
            {accommodation.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="size-3.5 text-brand-accent" />
          <span className="truncate">
            {accommodation.locationCity}, {accommodation.locationCountry}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-gray-700">{accommodation.experienceCount} experiences</span>
          {typeof accommodation.weightedOverallScore === "number" ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
              <Star className="size-3.5 fill-amber-400 text-amber-500" />
              <span className="font-semibold">{accommodation.weightedOverallScore.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-gray-400">No ratings yet</span>
          )}
        </div>
      </div>
    </article>
  );
}

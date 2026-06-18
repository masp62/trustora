export function PostCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Image placeholder */}
      <div className="h-52 w-full bg-gray-200 sm:h-60" />

      <div className="space-y-3 p-4 sm:p-5">
        {/* Title */}
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />

        {/* Location + trip type */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
        </div>

        {/* Author + like */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
          <div className="h-6 w-12 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function PostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

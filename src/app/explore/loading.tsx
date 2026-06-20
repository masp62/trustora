import { PostCardSkeletonGrid } from "@/components/explore/post-card-skeleton";

export default function ExploreLoading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      {/* Hero + Filters skeleton */}
      <section className="mx-auto mb-8 w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-gray-200 sm:h-14" />

        {/* Filter skeleton */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-100" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-gray-100" />
            ))}
          </div>
        </div>
      </section>

      {/* Post grid skeleton */}
      <section className="mx-auto w-full max-w-[1760px]">
        <PostCardSkeletonGrid count={9} />
      </section>
    </main>
  );
}

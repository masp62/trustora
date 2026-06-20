export default function ProfileLoading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mx-auto w-full max-w-[1760px] space-y-8">
        {/* Profile Header skeleton */}
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="size-24 animate-pulse rounded-full bg-gray-200 sm:size-28" />

            <div className="flex-1 space-y-4 text-center sm:text-left">
              {/* Name */}
              <div className="mx-auto h-7 w-48 animate-pulse rounded bg-gray-200 sm:mx-0 sm:h-8" />
              {/* Username */}
              <div className="mx-auto h-4 w-24 animate-pulse rounded bg-gray-200 sm:mx-0" />
              {/* Bio */}
              <div className="mx-auto max-w-lg space-y-2 sm:mx-0">
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
              {/* Meta */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              </div>
              {/* Stats */}
              <div className="flex items-center justify-center gap-6 sm:justify-start">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </section>

        {/* Post Grid skeleton */}
        <section>
          <div className="mb-4 h-6 w-16 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="h-44 w-full animate-pulse bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

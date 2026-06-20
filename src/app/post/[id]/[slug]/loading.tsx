export default function PostDetailLoading() {
  return (
    <main className="flex flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 sm:py-12">
      <article className="mx-auto w-full max-w-[1760px] space-y-8 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        {/* Header */}
        <header className="space-y-3">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200 sm:h-12" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </header>

        {/* Photo gallery skeleton */}
        <div className="flex gap-3 overflow-hidden rounded-2xl">
          <div className="h-64 min-w-[85%] animate-pulse rounded-2xl bg-gray-200 sm:h-80 sm:min-w-[70%]" />
          <div className="h-64 min-w-[85%] animate-pulse rounded-2xl bg-gray-100 sm:h-80 sm:min-w-[70%]" />
        </div>

        {/* Author section skeleton */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </section>

        {/* Story skeleton */}
        <section className="space-y-3">
          <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </section>

        {/* Stats skeleton */}
        <section className="space-y-2 rounded-2xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-gray-200" />
          </div>
        </section>

        {/* Comments skeleton */}
        <section className="space-y-4">
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </section>
      </article>
    </main>
  );
}

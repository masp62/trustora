export default function SearchLoading() {
  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="mx-auto w-full max-w-[1760px] space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="h-52 w-full bg-gray-200 sm:h-60" />
              <div className="space-y-3 p-4 sm:p-5">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="flex items-center gap-2 pt-1">
                  <div className="size-7 rounded-full bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold tracking-[0.14em] text-gray-500 uppercase">403</p>
        <h1 className="mt-3 font-heading text-3xl text-gray-900 sm:text-4xl">Access forbidden</h1>
        <p className="mt-3 text-gray-700">
          You are authenticated, but you are not allowed to access this page.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Go to Explore
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}

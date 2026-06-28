import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not Found - Trustora",
  description: "The page you are looking for does not exist.",
};

export default function NotFoundPage() {
  return (
    <main className="flex-1 px-4 py-14 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">404</p>
        <h1 className="mt-3 font-heading text-3xl text-gray-900 sm:text-4xl">Not Found</h1>
        <p className="mt-3 text-sm text-gray-600 sm:text-base">
          The page you requested could not be found.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-flex rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back to Explore
        </Link>
      </section>
    </main>
  );
}
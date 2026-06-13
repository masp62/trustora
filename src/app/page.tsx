export default function Home() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">
          Foundation Ready
        </p>
        <h1 className="mt-4 max-w-2xl font-heading text-4xl leading-tight text-gray-900 sm:text-6xl">
          RealBnB is scaffolded and ready for feature slices.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-700">
          This deployment confirms the App Router foundation is live with Prisma,
          seed data support, and a travel-focused design baseline.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-hover"
            href="/explore"
          >
            Explore (coming in next slice)
          </a>
          <a
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
          >
            Deploy on Vercel
          </a>
        </div>
      </section>
    </main>
  );
}

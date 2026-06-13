export default function Home() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-stone-200/80 bg-white/85 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">
          Foundation Ready
        </p>
        <h1 className="mt-4 max-w-2xl font-heading text-4xl leading-tight text-stone-900 sm:text-6xl">
          RealBnB is scaffolded and ready for feature slices.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-stone-700">
          This deployment confirms the App Router foundation is live with Prisma,
          seed data support, and a travel-focused design baseline.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500"
            href="/explore"
          >
            Explore (coming in next slice)
          </a>
          <a
            className="inline-flex items-center justify-center rounded-full border border-amber-700/30 px-6 py-3 font-semibold text-amber-800 transition hover:bg-amber-100/60"
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

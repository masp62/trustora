export default function HelpPage() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">
          Support
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-stone-900 sm:text-5xl">
          Help &amp; FAQ
        </h1>
        <p className="mt-4 text-stone-600">
          This page is coming soon. In the meantime, feel free to reach out to us at{" "}
          <a
            href="mailto:support@realbnb.com"
            className="font-semibold text-amber-700 hover:text-amber-600"
          >
            support@realbnb.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}

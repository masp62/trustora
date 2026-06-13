export default function HelpPage() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">
          Support
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-gray-900 sm:text-5xl">
          Help &amp; FAQ
        </h1>
        <p className="mt-4 text-gray-600">
          This page is coming soon. In the meantime, feel free to reach out to us at{" "}
          <a
            href="mailto:support@realbnb.com"
            className="font-semibold text-[#0066FF] hover:text-[#0052CC]"
          >
            support@realbnb.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}

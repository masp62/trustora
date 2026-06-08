import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function CreatePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 items-center px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">Protected Route</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-stone-900 sm:text-5xl">
          Create experience (coming next slice)
        </h1>
      </section>
    </main>
  );
}

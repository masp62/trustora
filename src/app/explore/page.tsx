import { Suspense } from "react";
import Link from "next/link";

import { auth } from "@/auth";

import { OnboardingPrompt } from "./onboarding-prompt";
import { ProfileSetupDialog } from "./profile-setup-dialog";

export default async function ExplorePage() {
  const session = await auth();

  return (
    <main className="flex flex-1 items-center px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">Explore</p>
        <h1 className="mt-4 max-w-2xl font-heading text-4xl leading-tight text-stone-900 sm:text-6xl">
          Discover real travel stay stories.
        </h1>

        <OnboardingPrompt />

        {session?.user && (
          <>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500"
              >
                Go to protected /create
              </Link>
            </div>
            <Suspense>
              <ProfileSetupDialog
                initialDisplayName={session.user.name ?? ""}
                initialBio=""
                initialLocation=""
              />
            </Suspense>
          </>
        )}
      </section>
    </main>
  );
}

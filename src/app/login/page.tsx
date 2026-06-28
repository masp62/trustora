import Link from "next/link";

import { googleAuthConfigured } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-start px-4 py-10 sm:items-center sm:px-6 sm:py-12 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto grid w-full max-w-[1760px] gap-8 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-12">
        <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 via-white to-sky-50 p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-cyan-200/40 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-sky-200/40 blur-2xl" aria-hidden="true" />
          <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Welcome back, traveler</p>
          <h1 className="mt-4 font-heading text-3xl leading-tight text-gray-900 sm:text-5xl">
            Sign in to Trustora
          </h1>
          <p className="mt-4 text-gray-700">
            Pick up your journey where you left off and keep your stay stories flowing.
          </p>

          <div className="mt-6 space-y-3 rounded-xl border border-cyan-100 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.08em] text-cyan-700 uppercase">Today on your trail</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>Track places you rated highest this month.</li>
              <li>Jump back into drafts before publishing.</li>
              <li>Reconnect with travelers you follow.</li>
            </ul>
          </div>

          {googleAuthConfigured ? (
            <form action={signInWithGoogle} className="mt-8">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full border border-cyan-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-cyan-50"
              >
                Quick sign-in with Google
              </button>
            </form>
          ) : (
            <p className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Google sign-in is not configured for this environment.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
          <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-gray-500 uppercase">Sign in with email</p>
          <LoginForm />
          <p className="mt-5 text-sm text-gray-600">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-brand hover:text-brand-hover">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}


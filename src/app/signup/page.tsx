import Link from "next/link";

import { googleAuthConfigured } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">Join RealBnB</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-stone-900 sm:text-5xl">
          Create your account
        </h1>
        <p className="mt-4 text-stone-700">
          Continue with Google or sign up with email and password.
        </p>

        <div className="mt-8 rounded-2xl border border-amber-100 bg-white p-6">
          {googleAuthConfigured ? (
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-6 py-3 font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Continue with Google
              </button>
            </form>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Google sign-up is not configured for this environment.
            </p>
          )}

          <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-[0.08em] text-stone-500 uppercase">
            <span className="h-px flex-1 bg-stone-200" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <SignupForm />
          <p className="mt-5 text-sm text-stone-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-600">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

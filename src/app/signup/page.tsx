import Link from "next/link";

import { googleAuthConfigured } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Join RealBnB</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-gray-900 sm:text-5xl">
          Create your account
        </h1>
        <p className="mt-4 text-gray-700">
          Continue with Google or sign up with email and password.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
          {googleAuthConfigured ? (
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Continue with Google
              </button>
            </form>
          ) : (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Google sign-up is not configured for this environment.
            </p>
          )}

          <div className="my-5 flex items-center gap-3 text-xs font-semibold tracking-[0.08em] text-gray-500 uppercase">
            <span className="h-px flex-1 bg-gray-200" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <SignupForm />
          <p className="mt-5 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#E0565B] hover:text-[#FF787C]">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

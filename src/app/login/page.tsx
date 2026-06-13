import Link from "next/link";

import { googleAuthConfigured } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto grid w-full max-w-[1760px] gap-8 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:grid-cols-2 sm:p-12">
        <div>
          <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">Welcome back</p>
          <h1 className="mt-4 font-heading text-4xl leading-tight text-gray-900 sm:text-5xl">
            Sign in to RealBnB
          </h1>
          <p className="mt-4 text-gray-700">
            Continue with Google or use your email and password.
          </p>

          {googleAuthConfigured ? (
            <form action={signInWithGoogle} className="mt-8">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Continue with Google
              </button>
            </form>
          ) : (
            <p className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Google sign-in is not configured for this environment.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <LoginForm />
          <p className="mt-5 text-sm text-gray-600">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-[#E0565B] hover:text-[#FF787C]">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

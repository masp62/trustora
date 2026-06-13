import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <section className="mx-auto w-full max-w-[1760px] rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase">
          Account recovery
        </p>
        <h1 className="mt-4 font-heading text-3xl leading-tight text-gray-900 sm:text-4xl">
          Forgot your password?
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a reset link.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
        <p className="mt-5 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-[#E0565B] hover:text-[#FF787C]">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

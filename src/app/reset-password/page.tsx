import { Suspense } from "react";

import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center px-6 py-12 sm:px-10">
      <section className="mx-auto w-full max-w-md rounded-[2rem] border border-stone-200/80 bg-white/90 p-8 shadow-xl shadow-amber-950/10 backdrop-blur sm:p-12">
        <p className="text-sm font-semibold tracking-[0.15em] text-amber-700 uppercase">
          Account recovery
        </p>
        <h1 className="mt-4 font-heading text-3xl leading-tight text-stone-900 sm:text-4xl">
          Reset your password
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Choose a new password for your account.
        </p>
        <div className="mt-6">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { initialAuthActionState, type AuthActionState } from "@/lib/auth-action-state";
import { requestPasswordReset } from "@/lib/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
    >
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    requestPasswordReset,
    initialAuthActionState,
  );

  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-stone-700">Email</span>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none ring-0 transition focus:border-amber-500"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

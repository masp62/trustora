"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";

import { initialAuthActionState, type AuthActionState } from "@/lib/auth-action-state";
import { resetPassword } from "@/lib/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-[#0066FF] px-6 py-3 font-semibold text-white transition hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Resetting..." : "Reset password"}
    </button>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, formAction] = useActionState<AuthActionState, FormData>(
    resetPassword,
    initialAuthActionState,
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (password !== confirmPassword) {
      event.preventDefault();
      setLocalError("Passwords do not match.");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    setLocalError(null);
  }

  const errorMessage = localError ?? state.error;

  if (state.success) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
        <a
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-full bg-[#0066FF] px-6 py-3 font-semibold text-white transition hover:bg-[#0052CC]"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">New password</span>
        <input
          required
          minLength={8}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-[#00A67E]"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Confirm password</span>
        <input
          required
          minLength={8}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-[#00A67E]"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

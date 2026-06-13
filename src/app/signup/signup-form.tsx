"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { initialAuthActionState, type AuthActionState } from "@/lib/auth-action-state";
import {
  signUpWithCredentials,
} from "@/lib/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-[#0066FF] px-6 py-3 font-semibold text-white transition hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    signUpWithCredentials,
    initialAuthActionState,
  );

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
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

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Display name</span>
        <input
          required
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-[#00A67E]"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Email</span>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-[#00A67E]"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Password</span>
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { initialAuthActionState, type AuthActionState } from "@/lib/auth-action-state";
import {
  signInWithCredentials,
} from "@/lib/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Signing in..." : "Sign in with email"}
    </button>
  );
}

export function LoginForm({ onForgotPassword }: { onForgotPassword?: () => void }) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    signInWithCredentials,
    initialAuthActionState,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Email</span>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-accent"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Password</span>
        <input
          required
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-accent"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <SubmitButton />

      {onForgotPassword ? (
        <p className="text-center text-sm text-gray-600">
          <button
            type="button"
            onClick={onForgotPassword}
            className="touch-target px-2 font-semibold text-brand hover:text-brand-hover"
          >
            Forgot password?
          </button>
        </p>
      ) : (
        <p className="text-center text-sm text-gray-600">
          <a
            href="/forgot-password"
            className="touch-target inline-flex items-center px-2 font-semibold text-brand hover:text-brand-hover"
          >
            Forgot password?
          </a>
        </p>
      )}
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { initialAuthActionState, type AuthActionState } from "@/lib/auth-action-state";
import { completeProfileSetup } from "@/lib/auth-actions";

type ProfileSetupFormProps = {
  initialDisplayName: string;
  initialBio: string;
  initialLocation: string;
  onSkip?: () => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-300"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export function ProfileSetupForm({
  initialDisplayName,
  initialBio,
  initialLocation,
  onSkip,
}: ProfileSetupFormProps) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    completeProfileSetup,
    initialAuthActionState,
  );

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-stone-700">Display name</span>
        <input
          required
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none ring-0 transition focus:border-amber-500"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-stone-700">Bio (optional)</span>
        <textarea
          name="bio"
          maxLength={280}
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none ring-0 transition focus:border-amber-500"
        />
        <p className="text-xs text-stone-500">{bio.length}/280 characters</p>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-stone-700">Location (optional)</span>
        <input
          name="location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none ring-0 transition focus:border-amber-500"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <SubmitButton />

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex w-full items-center justify-center rounded-full border border-amber-200 px-6 py-3 text-sm font-medium text-stone-600 transition hover:bg-amber-50"
        >
          Skip for now
        </button>
      )}
    </form>
  );
}

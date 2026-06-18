"use client";

import { useActionState, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useFormStatus } from "react-dom";

import { initialAuthActionState, type AuthActionState } from "@/lib/auth-action-state";
import { updateProfile } from "@/lib/profile-actions";

type EditProfileFormProps = {
  initialDisplayName: string;
  initialBio: string;
  initialLocation: string;
  initialUsername: string;
  initialAvatarUrl: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

export function EditProfileForm({
  initialDisplayName,
  initialBio,
  initialLocation,
  initialUsername,
  initialAvatarUrl,
}: EditProfileFormProps) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    updateProfile,
    initialAuthActionState,
  );

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setUploadError(payload.error ?? "Upload failed");
        setAvatarPreview(initialAvatarUrl ?? "");
        return;
      }

      const payload = (await response.json()) as { url: string };
      setAvatarUrl(payload.url);
      setAvatarPreview(payload.url);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setAvatarPreview(initialAvatarUrl ?? "");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field to pass avatarUrl */}
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative"
          disabled={uploading}
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="size-24 rounded-full border-2 border-gray-200 object-cover"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-3xl font-bold text-gray-700">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Camera className="size-6 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
          aria-label="Upload avatar"
        />
        <p className="text-xs text-gray-500">
          {uploading ? "Uploading…" : "Click to change avatar"}
        </p>
        {uploadError && (
          <p className="text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Display name */}
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Display name</span>
        <input
          required
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-accent"
        />
      </label>

      {/* Username */}
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Username</span>
        <input
          required
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase())}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-accent"
        />
        <p className="text-xs text-gray-500">
          Lowercase letters, numbers, and hyphens. 2–24 characters.
        </p>
      </label>

      {/* Bio */}
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Bio (optional)</span>
        <textarea
          name="bio"
          maxLength={280}
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-accent"
        />
        <p className="text-xs text-gray-500">{bio.length}/280 characters</p>
      </label>

      {/* Location */}
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Location (optional)</span>
        <input
          name="location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-brand-accent"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

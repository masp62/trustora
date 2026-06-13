"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { createExperiencePost } from "@/lib/post-actions";
import { initialPostActionState } from "@/lib/post-action-state";
import {
  MAX_PHOTOS_PER_POST,
  MAX_TAGS_PER_POST,
  MIN_PHOTOS_PER_POST,
  POST_BODY_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  PREDEFINED_TAGS,
  PROPERTY_NAME_MAX_LENGTH,
  TRIP_TYPES,
} from "@/lib/post-constants";

type UploadedPhoto = {
  name: string;
  url: string;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center rounded-full bg-[#E0565B] px-6 py-3 font-semibold text-white transition hover:bg-[#FF787C] disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Publishing..." : "Publish experience"}
    </button>
  );
}

export function CreatePostForm() {
  const [state, formAction] = useActionState(createExperiencePost, initialPostActionState);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [tripType, setTripType] = useState<(typeof TRIP_TYPES)[number] | "">("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [clientErrors, setClientErrors] = useState<{
    title?: string;
    body?: string;
    location?: string;
    photos?: string;
    tags?: string;
  }>({});

  const titleRemaining = POST_TITLE_MAX_LENGTH - title.length;
  const bodyRemaining = POST_BODY_MAX_LENGTH - body.length;

  const hasFormBlockingIssue = useMemo(
    () =>
      isUploading ||
      selectedTags.length > MAX_TAGS_PER_POST ||
      uploadedPhotos.length > MAX_PHOTOS_PER_POST,
    [isUploading, selectedTags.length, uploadedPhotos.length],
  );

  function toggleTag(tag: string) {
    setClientErrors((prev) => ({ ...prev, tags: undefined }));

    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }

      if (prev.length >= MAX_TAGS_PER_POST) {
        setClientErrors((old) => ({ ...old, tags: `Select up to ${MAX_TAGS_PER_POST} tags.` }));
        return prev;
      }

      return [...prev, tag];
    });
  }

  async function handlePhotoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (uploadedPhotos.length + files.length > MAX_PHOTOS_PER_POST) {
      setClientErrors((prev) => ({
        ...prev,
        photos: `You can upload up to ${MAX_PHOTOS_PER_POST} photos.`,
      }));
      event.target.value = "";
      return;
    }

    setClientErrors((prev) => ({ ...prev, photos: undefined }));
    setIsUploading(true);

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as { url?: string; error?: string };

          if (!response.ok || !payload.url) {
            throw new Error(payload.error ?? "Upload failed");
          }

          return {
            name: file.name,
            url: payload.url,
          };
        }),
      );

      setUploadedPhotos((prev) => [...prev, ...uploaded]);
    } catch (error) {
      setClientErrors((prev) => ({
        ...prev,
        photos: error instanceof Error ? error.message : "Upload failed.",
      }));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function removePhoto(url: string) {
    setUploadedPhotos((prev) => prev.filter((photo) => photo.url !== url));
  }

  function validateBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextErrors: typeof clientErrors = {};
    const hiddenPhotoInputs = event.currentTarget.querySelectorAll('input[name="photoUrls"]');
    const totalPhotos = hiddenPhotoInputs.length;

    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!body.trim()) {
      nextErrors.body = "Body is required.";
    }

    if (!locationCity.trim() || !locationCountry.trim()) {
      nextErrors.location = "City and country are required.";
    }

    if (totalPhotos < MIN_PHOTOS_PER_POST) {
      nextErrors.photos = "Upload at least one photo.";
    }

    if (selectedTags.length > MAX_TAGS_PER_POST) {
      nextErrors.tags = `Select up to ${MAX_TAGS_PER_POST} tags.`;
    }

    setClientErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || isUploading) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={validateBeforeSubmit} className="mt-8 space-y-6">
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Title</span>
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={POST_TITLE_MAX_LENGTH}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#008489]"
        />
        <p className="text-xs text-gray-500">{titleRemaining} characters remaining</p>
        {(clientErrors.title ?? state.fieldErrors.title) && (
          <p className="text-sm text-red-700">{clientErrors.title ?? state.fieldErrors.title}</p>
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Story</span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={POST_BODY_MAX_LENGTH}
          rows={8}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#008489]"
        />
        <p className="text-xs text-gray-500">{bodyRemaining} characters remaining</p>
        {(clientErrors.body ?? state.fieldErrors.body) && (
          <p className="text-sm text-red-700">{clientErrors.body ?? state.fieldErrors.body}</p>
        )}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-semibold text-gray-700">City</span>
          <input
            name="locationCity"
            value={locationCity}
            onChange={(event) => setLocationCity(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#008489]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold text-gray-700">Country</span>
          <input
            name="locationCountry"
            value={locationCountry}
            onChange={(event) => setLocationCountry(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#008489]"
          />
        </label>
      </div>

      {(clientErrors.location ?? state.fieldErrors.location) && (
        <p className="text-sm text-red-700">{clientErrors.location ?? state.fieldErrors.location}</p>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Property name (optional)</span>
        <input
          name="propertyName"
          value={propertyName}
          onChange={(event) => setPropertyName(event.target.value)}
          maxLength={PROPERTY_NAME_MAX_LENGTH}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#008489]"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Trip type</span>
        <select
          name="tripType"
          value={tripType}
          onChange={(event) => setTripType(event.target.value as (typeof TRIP_TYPES)[number])}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-[#008489]"
        >
          <option value="">Select trip type</option>
          {TRIP_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {state.fieldErrors.tripType && <p className="text-sm text-red-700">{state.fieldErrors.tripType}</p>}
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-gray-700">
          Tags ({selectedTags.length}/{MAX_TAGS_PER_POST})
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PREDEFINED_TAGS.map((tag) => {
            const checked = selectedTags.includes(tag);
            const disabled = !checked && selectedTags.length >= MAX_TAGS_PER_POST;

            return (
              <label key={tag} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleTag(tag)}
                />
                <span>{tag}</span>
              </label>
            );
          })}
        </div>
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
        {(clientErrors.tags ?? state.fieldErrors.tags) && (
          <p className="text-sm text-red-700">{clientErrors.tags ?? state.fieldErrors.tags}</p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-gray-700">
          Photos ({uploadedPhotos.length}/{MAX_PHOTOS_PER_POST})
        </legend>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotoSelection}
          className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
        />

        {isUploading && <p className="text-sm text-gray-600">Uploading photos...</p>}

        {uploadedPhotos.length > 0 && (
          <ul className="space-y-2">
            {uploadedPhotos.map((photo) => (
              <li key={photo.url} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                <div className="truncate pr-3 text-gray-800">{photo.name}</div>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.url)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Remove
                </button>
                <input type="hidden" name="photoUrls" value={photo.url} />
              </li>
            ))}
          </ul>
        )}

        {(clientErrors.photos ?? state.fieldErrors.photos) && (
          <p className="text-sm text-red-700">{clientErrors.photos ?? state.fieldErrors.photos}</p>
        )}
      </fieldset>

      {state.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <SubmitButton disabled={hasFormBlockingIssue} />
    </form>
  );
}

"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";

import { updateExperiencePost } from "@/lib/post-actions";
import {
  ACCOMMODATION_RATING_CATEGORIES,
  type AccommodationRatingCategoryKey,
} from "@/lib/accommodation-rating-categories";
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

type EditPostFormProps = {
  post: {
    id: string;
    status: "draft" | "published";
    visibility: "public" | "private";
    title: string;
    body: string;
    locationCity: string;
    locationCountry: string;
    propertyName: string;
    tripType: string;
    categoryRatings: Record<AccommodationRatingCategoryKey, number>;
    images: string[];
    tags: string[];
  };
};

function SubmitButtons({
  disabled,
  status,
  setIntent,
}: {
  disabled: boolean;
  status: "draft" | "published";
  setIntent: (intent: "draft" | "publish") => void;
}) {
  const { pending } = useFormStatus();

  if (status === "published") {
    return (
      <button
        type="submit"
        onClick={() => setIntent("publish")}
        disabled={pending || disabled}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="submit"
        onClick={() => setIntent("publish")}
        disabled={pending || disabled}
        className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {pending ? "Saving..." : "Publish now"}
      </button>
      <button
        type="submit"
        onClick={() => setIntent("draft")}
        disabled={pending || disabled}
        className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {pending ? "Saving..." : "Save as draft"}
      </button>
    </div>
  );
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [state, formAction] = useActionState(updateExperiencePost, initialPostActionState);

  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [locationCity, setLocationCity] = useState(post.locationCity);
  const [locationCountry, setLocationCountry] = useState(post.locationCountry);
  const [propertyName, setPropertyName] = useState(post.propertyName);
  const [tripType, setTripType] = useState<string>(post.tripType);
  const [categoryRatings, setCategoryRatings] = useState<Record<AccommodationRatingCategoryKey, number>>(
    post.categoryRatings,
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(post.tags);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>(
    post.images.map((url) => ({ name: url.split("/").pop() ?? "photo", url })),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish">(
    post.status === "draft" ? "draft" : "publish",
  );

  const [clientErrors, setClientErrors] = useState<{
    title?: string;
    body?: string;
    location?: string;
    photos?: string;
    tags?: string;
    accommodationRatingCategories?: string;
  }>({});

  const titleRemaining = POST_TITLE_MAX_LENGTH - title.length;
  const bodyRemaining = POST_BODY_MAX_LENGTH - body.length;
  const computedOverallRating = useMemo(() => {
    const enteredValues = ACCOMMODATION_RATING_CATEGORIES.map(({ key }) => categoryRatings[key]).filter(
      (value) => Number.isInteger(value) && value >= 1 && value <= 5,
    );

    if (enteredValues.length === 0) {
      return null;
    }

    return Number((enteredValues.reduce((sum, value) => sum + value, 0) / enteredValues.length).toFixed(1));
  }, [categoryRatings]);

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

    const hasInvalidCategoryRating = ACCOMMODATION_RATING_CATEGORIES.some(({ key }) => {
      const value = categoryRatings[key];
      return !Number.isInteger(value) || value < 1 || value > 5;
    });
    if (hasInvalidCategoryRating) {
      nextErrors.accommodationRatingCategories = "Please rate all accommodation categories (1-5 stars).";
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
      <input type="hidden" name="postId" value={post.id} />
      <input type="hidden" name="intent" value={submitIntent} />

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Title</span>
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={POST_TITLE_MAX_LENGTH}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-brand-accent"
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
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-brand-accent"
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
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-brand-accent"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold text-gray-700">Country</span>
          <input
            name="locationCountry"
            value={locationCountry}
            onChange={(event) => setLocationCountry(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-brand-accent"
          />
        </label>
      </div>

      {(clientErrors.location ?? state.fieldErrors.location) && (
        <p className="text-sm text-red-700">{clientErrors.location ?? state.fieldErrors.location}</p>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Property name</span>
        <input
          name="propertyName"
          value={propertyName}
          onChange={(event) => setPropertyName(event.target.value)}
          maxLength={PROPERTY_NAME_MAX_LENGTH}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-brand-accent"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-gray-700">Trip type</span>
        <select
          name="tripType"
          value={tripType}
          onChange={(event) => setTripType(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-brand-accent"
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

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">Accommodation rating categories</legend>
        <p className="text-xs text-gray-500">
          Overall rating is calculated automatically from all category ratings (equal weight).
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm">
          <span className="font-medium text-amber-700">Overall</span>
          <div className="flex items-center gap-1" aria-label={computedOverallRating ? `${computedOverallRating.toFixed(1)} of 5 stars` : "No overall rating yet"}>
            {Array.from({ length: 5 }, (_, i) => {
              const rounded = computedOverallRating ? Math.round(computedOverallRating) : 0;
              const filled = i < rounded;
              return (
                <Star
                  key={i}
                  className={`size-4 ${filled ? "fill-amber-400 text-amber-500" : "text-amber-200"}`}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          <span className="font-semibold text-amber-800">{computedOverallRating ? `${computedOverallRating.toFixed(1)}/5` : "-"}</span>
        </div>
        {ACCOMMODATION_RATING_CATEGORIES.map((category) => (
          <div key={category.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">{category.label}</p>
            <div className="flex items-center gap-2" role="radiogroup" aria-label={category.label}>
              {Array.from({ length: 5 }, (_, i) => {
                const value = i + 1;
                const active = value <= categoryRatings[category.key];

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={categoryRatings[category.key] === value}
                    onClick={() => {
                      setCategoryRatings((prev) => ({ ...prev, [category.key]: value }));
                      setClientErrors((prev) => ({ ...prev, accommodationRatingCategories: undefined }));
                    }}
                    className="rounded-full p-1 transition hover:bg-gray-100"
                  >
                    <Star className={`size-5 ${active ? "fill-amber-400 text-amber-500" : "text-gray-300"}`} />
                  </button>
                );
              })}
              <span className="ml-1 text-xs text-gray-500">{categoryRatings[category.key] || 0}/5</span>
            </div>
            <input type="hidden" name={category.key} value={categoryRatings[category.key] > 0 ? String(categoryRatings[category.key]) : ""} />
          </div>
        ))}
        {(clientErrors.accommodationRatingCategories ?? state.fieldErrors.accommodationRatingCategories) && (
          <p className="text-sm text-red-700">
            {clientErrors.accommodationRatingCategories ?? state.fieldErrors.accommodationRatingCategories}
          </p>
        )}
      </fieldset>

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

      <SubmitButtons disabled={hasFormBlockingIssue} status={post.status} setIntent={setSubmitIntent} />
    </form>
  );
}

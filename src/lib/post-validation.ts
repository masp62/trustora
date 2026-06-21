import { ACCOMMODATION_RATING_CATEGORIES, type AccommodationRatingCategoryKey } from "@/lib/accommodation-rating-categories";
import { type PostActionFieldErrors } from "@/lib/post-action-state";
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

export type PostValidationFields = {
  title: string;
  body: string;
  locationCity: string;
  locationCountry: string;
  propertyName: string;
  tripType: string;
  categoryRatings: Record<AccommodationRatingCategoryKey, number>;
  tags: string[];
  photoUrls: string[];
};

export type PostValidationResult = {
  valid: boolean;
  fieldErrors: PostActionFieldErrors;
};

/**
 * Validates experience post fields. Works on both client and server (no DB calls).
 * mode='draft' currently applies the same rules as 'publish'; relaxation is tracked in #23g.
 */
export function validatePostInput(
  fields: PostValidationFields,
  mode: "draft" | "publish",
): PostValidationResult {
  void mode; // reserved for future draft relaxation (#23g)

  const fieldErrors: PostActionFieldErrors = {};
  const { title, body, locationCity, locationCountry, propertyName, tripType, categoryRatings, tags, photoUrls } =
    fields;

  if (!title) {
    fieldErrors.title = "Title is required.";
  } else if (title.length > POST_TITLE_MAX_LENGTH) {
    fieldErrors.title = `Title must be ${POST_TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (!body) {
    fieldErrors.body = "Body is required.";
  } else if (body.length > POST_BODY_MAX_LENGTH) {
    fieldErrors.body = `Body must be ${POST_BODY_MAX_LENGTH} characters or fewer.`;
  }

  if (!locationCity || !locationCountry) {
    fieldErrors.location = "City and country are required.";
  }

  if (propertyName.length > PROPERTY_NAME_MAX_LENGTH) {
    fieldErrors.location = `Property name must be ${PROPERTY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!TRIP_TYPES.includes(tripType as (typeof TRIP_TYPES)[number])) {
    fieldErrors.tripType = "Trip type is required.";
  }

  const hasInvalidCategoryRating = ACCOMMODATION_RATING_CATEGORIES.some(({ key }) => {
    const value = categoryRatings[key];
    return !Number.isInteger(value) || value < 1 || value > 5;
  });
  if (hasInvalidCategoryRating) {
    fieldErrors.accommodationRatingCategories = "Please rate all accommodation categories (1-5 stars).";
  }

  if (tags.length > MAX_TAGS_PER_POST) {
    fieldErrors.tags = `Select up to ${MAX_TAGS_PER_POST} tags.`;
  }

  const hasInvalidTag = tags.some((tag) => !PREDEFINED_TAGS.includes(tag as (typeof PREDEFINED_TAGS)[number]));
  if (hasInvalidTag) {
    fieldErrors.tags = "One or more selected tags are invalid.";
  }

  if (photoUrls.length < MIN_PHOTOS_PER_POST) {
    fieldErrors.photos = "Upload at least one photo.";
  } else if (photoUrls.length > MAX_PHOTOS_PER_POST) {
    fieldErrors.photos = `Upload up to ${MAX_PHOTOS_PER_POST} photos.`;
  }

  const hasInvalidPhotoUrl = photoUrls.some((url) => !url.startsWith("/uploads/"));
  if (hasInvalidPhotoUrl) {
    fieldErrors.photos = "Uploaded photo URLs are invalid.";
  }

  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

/** Converts a PostValidationResult to a single error string for use in non-form contexts (e.g. draft publish). */
export function firstValidationError(result: PostValidationResult): string | null {
  if (result.valid) return null;
  const order: (keyof PostActionFieldErrors)[] = [
    "title",
    "body",
    "location",
    "tripType",
    "accommodationRatingCategories",
    "tags",
    "photos",
  ];
  for (const key of order) {
    if (result.fieldErrors[key]) return result.fieldErrors[key]!;
  }
  return "Please fix the highlighted fields.";
}

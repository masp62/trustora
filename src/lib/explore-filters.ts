import { PREDEFINED_TAGS, TRIP_TYPES } from "@/lib/post-constants";

export type FilterState = {
  country: string;
  city: string;
  tripType: string;
  tags: string[];
};

export function parseFiltersFromParams(params: URLSearchParams): FilterState {
  const tripType = (params.get("tripType") ?? "").trim();
  const rawTags = params
    .get("tags")
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean) ?? [];

  const allowedTripTypes = new Set<string>(TRIP_TYPES);
  const allowedTags = new Set<string>(PREDEFINED_TAGS);

  return {
    country: (params.get("country") ?? "").trim(),
    city: (params.get("city") ?? "").trim(),
    tripType: allowedTripTypes.has(tripType) ? tripType : "",
    tags: [...new Set(rawTags.filter((tag) => allowedTags.has(tag)))],
  };
}

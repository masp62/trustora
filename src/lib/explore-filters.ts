export type FilterState = {
  country: string;
  city: string;
  tripType: string;
  tags: string[];
};

export function parseFiltersFromParams(params: URLSearchParams): FilterState {
  return {
    country: params.get("country") ?? "",
    city: params.get("city") ?? "",
    tripType: params.get("tripType") ?? "",
    tags: params.get("tags")?.split(",").filter(Boolean) ?? [],
  };
}

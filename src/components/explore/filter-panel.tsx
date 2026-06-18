"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { parseFiltersFromParams, type FilterState } from "@/lib/explore-filters";

const TRIP_TYPES = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "business", label: "Business" },
] as const;

const TAGS = [
  "beach",
  "city-break",
  "countryside",
  "luxury",
  "budget",
  "pet-friendly",
  "unique-stay",
  "remote-work",
] as const;

function toLabel(tag: string) {
  return tag
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.country) params.set("country", filters.country);
  if (filters.city) params.set("city", filters.city);
  if (filters.tripType) params.set("tripType", filters.tripType);
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  return params;
}

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount =
    (currentFilters.country ? 1 : 0) +
    (currentFilters.city ? 1 : 0) +
    (currentFilters.tripType ? 1 : 0) +
    currentFilters.tags.length;

  const applyFilters = useCallback(
    (next: FilterState) => {
      const params = filtersToParams(next);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/explore?${qs}` : "/explore", { scroll: false });
      });
    },
    [router],
  );

  const clearAll = useCallback(() => {
    applyFilters({ country: "", city: "", tripType: "", tags: [] });
  }, [applyFilters]);

  const setCountry = (value: string) =>
    applyFilters({ ...currentFilters, country: value });

  const setCity = (value: string) =>
    applyFilters({ ...currentFilters, city: value });

  const toggleTripType = (value: string) =>
    applyFilters({
      ...currentFilters,
      tripType: currentFilters.tripType === value ? "" : value,
    });

  const toggleTag = (tag: string) => {
    const next = currentFilters.tags.includes(tag)
      ? currentFilters.tags.filter((t) => t !== tag)
      : [...currentFilters.tags, tag];
    applyFilters({ ...currentFilters, tags: next });
  };

  const filterControls = (
    <div className="space-y-4">
      {/* Location inputs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Country"
            value={currentFilters.country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="City"
            value={currentFilters.city}
            onChange={(e) => setCity(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {/* Trip type buttons */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Trip type
        </p>
        <div className="flex flex-wrap gap-2">
          {TRIP_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleTripType(value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                currentFilters.tripType === value
                  ? "border-brand bg-brand text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag chips */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const active = currentFilters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-brand-accent bg-brand-accent text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {toLabel(tag)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Desktop: always visible top bar */}
      <div className="hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:block">
        {filterControls}

        {activeCount > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">
              {activeCount} {activeCount === 1 ? "filter" : "filters"} active
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-brand transition hover:text-brand-hover"
            >
              Clear all
            </button>
            {isPending && (
              <span className="text-xs text-gray-400">Updating…</span>
            )}
          </div>
        )}
      </div>

      {/* Mobile: toggle drawer */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-xs text-gray-400">
            {mobileOpen ? "Hide" : "Show"}
          </span>
        </button>

        {mobileOpen && (
          <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {filterControls}

            {activeCount > 0 && (
              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-medium text-brand transition hover:text-brand-hover"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active filter pills (summary below panel) */}
      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {currentFilters.country && (
            <FilterPill
              label={`Country: ${currentFilters.country}`}
              onRemove={() => setCountry("")}
            />
          )}
          {currentFilters.city && (
            <FilterPill
              label={`City: ${currentFilters.city}`}
              onRemove={() => setCity("")}
            />
          )}
          {currentFilters.tripType && (
            <FilterPill
              label={toLabel(currentFilters.tripType)}
              onRemove={() => toggleTripType(currentFilters.tripType)}
            />
          )}
          {currentFilters.tags.map((tag) => (
            <FilterPill
              key={tag}
              label={toLabel(tag)}
              onRemove={() => toggleTag(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

"use client";

import { Search } from "lucide-react";
import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchNavForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const inputRef = useRef<HTMLInputElement | null>(null);

  function submitSearch(rawQuery: string) {
    const trimmed = rawQuery.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/explore");
  }

  return (
    <div className="hidden items-center sm:flex" role="search" aria-label="Site search">
      <label htmlFor="site-search" className="sr-only">
        Search stories
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          key={currentQuery}
          id="site-search"
          ref={inputRef}
          type="search"
          defaultValue={currentQuery}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch(event.currentTarget.value);
            }
          }}
          placeholder="Search stories"
          className="h-9 w-44 rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:w-56 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 lg:w-56"
        />
        <button
          type="button"
          aria-label="Submit search"
          onClick={() => submitSearch(inputRef.current?.value ?? "")}
          className="sr-only"
        >
          Search
        </button>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { parseFiltersFromParams } from "@/lib/explore-filters";
import { EXPLORE_PAGE_SIZE, getExplorePostsPage } from "@/lib/explore-feed";

function clampLimit(value: number) {
  if (Number.isNaN(value)) return EXPLORE_PAGE_SIZE;
  return Math.min(40, Math.max(1, value));
}

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const filters = parseFiltersFromParams(url.searchParams);

  const offsetParam = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? `${EXPLORE_PAGE_SIZE}`, 10);

  const offset = Number.isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);
  const limit = clampLimit(limitParam);

  const result = await getExplorePostsPage(session?.user?.id ?? null, filters, offset, limit);

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { parseFiltersFromParams } from "@/lib/explore-filters";
import { EXPLORE_PAGE_SIZE } from "@/lib/explore-constants";
import { getExplorePostsPage } from "@/lib/explore-feed";

function clampLimit(value: number) {
  if (Number.isNaN(value)) return EXPLORE_PAGE_SIZE;
  return Math.min(40, Math.max(1, value));
}

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const filters = parseFiltersFromParams(url.searchParams);

  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? `${EXPLORE_PAGE_SIZE}`, 10);
  const cursorParam = url.searchParams.get("cursor");

  const limit = clampLimit(limitParam);
  const cursor = cursorParam && cursorParam.trim().length > 0 ? cursorParam : null;

  const result = await getExplorePostsPage(session?.user?.id ?? null, filters, cursor, limit);

  return NextResponse.json(result);
}

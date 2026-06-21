import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { HOME_PAGE_SIZE } from "@/lib/home-feed-constants";
import { getHomeFeedPage } from "@/lib/home-feed";

function clampLimit(value: number) {
  if (Number.isNaN(value)) {
    return HOME_PAGE_SIZE;
  }

  return Math.min(40, Math.max(1, value));
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? `${HOME_PAGE_SIZE}`, 10);
  const cursorParam = url.searchParams.get("cursor");

  const limit = clampLimit(limitParam);
  const cursor = cursorParam && cursorParam.trim().length > 0 ? cursorParam : null;

  const result = await getHomeFeedPage(session.user.id, cursor, limit);
  return NextResponse.json(result);
}

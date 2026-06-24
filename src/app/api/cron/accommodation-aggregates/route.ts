import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { recomputeAccommodationAggregate } from "@/lib/accommodations";

export async function POST(request: Request) {
  const token = request.headers.get("x-cron-token");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const accommodations = (await db.accommodation.findMany({
    select: { id: true },
  })) as Array<{ id: string }>;

  await Promise.all(accommodations.map((accommodation) => recomputeAccommodationAggregate(accommodation.id)));

  return NextResponse.json({ ok: true, recomputed: accommodations.length });
}

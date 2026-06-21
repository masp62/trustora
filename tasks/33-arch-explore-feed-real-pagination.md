# #33 — Fix explore-feed's in-memory sort-then-slice pagination

**Type:** AFK
**Blocked by:** #31 — Deepen PostCardData assembly into one module, #32 — Replace the in-memory Prisma emulator with a real test database

## What to build

`src/lib/explore-feed.ts` exposes a cursor-pagination interface (`cursor`, `take`) but the implementation loads **all** matching posts from Postgres into Node.js memory, computes an engagement score for each in JS, sorts the full set, then slices. With a country filter matching 5,000 posts this means:

- 5,000 post rows into Node.js
- All likes for those 5,000 posts (potentially 50,000+ rows)
- All comments for those 5,000 posts
- JS sort + slice to 20
- Then the per-post N+1 assembly loop (or `assembleFeedCards` after #31)

Additionally, the cursor encodes a computed `engagementScore` that changes as new likes arrive — any cursor a client holds becomes invalid mid-scroll.

Fix by persisting `engagementScore` on the `ExperiencePost` table and pushing sort + pagination to the DB:

1. Add `engagementScore Float @default(0)` to `prisma/schema.prisma` and create the migration.
2. Update `engagementScore` on the post record whenever a like or comment is added or removed (inline in the relevant action or via a DB trigger).
3. Replace the in-memory load in `explore-feed.ts` with `findMany({ orderBy: { engagementScore: 'desc' }, skip, take: pageSize + 1 })`.
4. Express the cursor as `{ id, engagementScore }` (stable, tied to the row's stored score).
5. Use `assembleFeedCards` from #31 for the result assembly.

The caller interface (`getExploreFeed(filters, cursor, pageSize)`) does not change.

## Acceptance criteria

- [ ] `ExperiencePost` has a persisted `engagementScore` column in the schema and migration
- [ ] `engagementScore` is updated on like/unlike and comment add/delete
- [ ] `explore-feed.ts` uses DB-side `orderBy + skip/take`, not JS sort + slice
- [ ] No full-table load into Node.js remains in `explore-feed.ts`
- [ ] Cursor is stable across requests (does not change as new interactions arrive)
- [ ] Uses `assembleFeedCards` from #31
- [ ] All existing Playwright explore and feed tests continue to pass

## Blocked by

- #31 — Deepen PostCardData assembly into one module
- #32 — Replace the in-memory Prisma emulator with a real test database

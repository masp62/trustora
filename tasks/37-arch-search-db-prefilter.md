# #37 — Push search filtering into the DB

**Type:** AFK
**Blocked by:** #31 — Deepen PostCardData assembly into one module

## What to build

`src/lib/search-feed.ts` loads every published post from Postgres into Node.js memory on every search query, then filters and ranks in JS:

```ts
const posts = await db.experiencePost.findMany({
  where: { status: "published" },  // no text filter — all posts
});
const ranked = posts
  .map((post) => ({ post, relevance: computeRelevance(post, normalizedQuery) }))
  .filter((entry) => entry.relevance > 0)
  .sort(...);
```

This is O(n posts) rows into Node.js memory per search. The `computeRelevance` function is pure and well-structured, but the call site defeats it: there is no DB-side pre-filtering at all.

Add a DB-side pre-filter before the JS re-ranking step:

1. Add a Postgres `ILIKE` pre-filter (or `pg_trgm` full-text index for production scale) to `findMany`:
   ```ts
   where: {
     status: "published",
     OR: [
       { title: { contains: query, mode: "insensitive" } },
       { body: { contains: query, mode: "insensitive" } },
       { propertyName: { contains: query, mode: "insensitive" } },
     ]
   }
   ```
2. Keep `computeRelevance` for re-ranking the filtered candidate set (it remains pure and testable).
3. Replace the inline per-post assembly loop with `assembleFeedCards` from #31.

The caller interface (`searchPosts(viewerId, query)`) does not change.

Optionally: add a Postgres `pg_trgm` GIN index on `title` and `body` columns if performance profiling warrants it (note in comments, don't auto-add).

## Acceptance criteria

- [ ] `searchPosts` applies a DB-side `contains` / `ILIKE` pre-filter before JS re-ranking
- [ ] No full table load into Node.js for search queries
- [ ] `computeRelevance` is preserved and still used for re-ranking the filtered set
- [ ] `assembleFeedCards` from #31 is used for result assembly
- [ ] All existing Playwright full-text search tests continue to pass

## Blocked by

- #31 — Deepen PostCardData assembly into one module

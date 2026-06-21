# #31 — Deepen PostCardData assembly into one module

**Type:** AFK
**Blocked by:** None

## What to build

Five feed modules each contain an identical `Promise.all(posts.map(async (post) => ...))` loop that fires 3 individual DB queries per post (author lookup, cover image lookup, like count). With 20 posts per page, this is 60 sequential round-trips — and the pattern is duplicated in:

- `src/lib/explore-feed.ts`
- `src/lib/home-feed.ts`
- `src/lib/tag-feed.ts`
- `src/lib/location-feed.ts`
- `src/lib/search-feed.ts`

The `PostCardData` shape is also implicit — each assembler constructs it inline, so the type contract is only enforced by TypeScript's structural check, not a single authoritative definition.

Create `src/lib/post-card-assembly.ts` that exports:

```ts
assembleFeedCards(posts: RawPost[], viewerId: string | null): Promise<PostCardData[]>
```

The implementation batches all per-post lookups into 4 queries total (regardless of page size):
1. `user.findMany({ where: { id: { in: authorIds } } })` — all authors in one query
2. `postImage.findMany({ where: { postId: { in: postIds }, order: 0 } })` — cover images in one query
3. `like.groupBy({ by: ['postId'], _count: true, where: { postId: { in: postIds } } })` — like counts in one query
4. (if `viewerId`) `like.findMany({ where: { postId: { in: postIds }, userId: viewerId } })` — viewer likes in one query

Remove the inline assembly loops from all five feed files and replace with a call to `assembleFeedCards`.

## Acceptance criteria

- [ ] `src/lib/post-card-assembly.ts` exports `assembleFeedCards(posts, viewerId)`
- [ ] All five feed files (`explore-feed.ts`, `home-feed.ts`, `tag-feed.ts`, `location-feed.ts`, `search-feed.ts`) call `assembleFeedCards` instead of their inline loops
- [ ] No per-post individual DB queries remain in any feed file
- [ ] `PostCardData` type is defined once in `post-card-assembly.ts` (or `src/types/`) and imported everywhere
- [ ] All existing Playwright feed and explore tests continue to pass

## Blocked by

None

# #35 — Move postCanonicalPath to lib/ and centralise cache invalidation

**Type:** AFK
**Blocked by:** None

## What to build

Two related problems in the current codebase:

**1. Inverted dependency direction**
`postCanonicalPath(postId, slug)` is defined in `src/app/post/post-detail-data.ts` but imported by four `lib/` action files (`like-actions.ts`, `comment-actions.ts`, `admin-actions.ts`, `report-actions.ts`). This makes `lib/` depend on `app/` — the wrong direction. `lib/` should be the stable inner ring; `app/` imports from `lib/`, not the other way around.

**2. revalidatePath strings scattered across 4 files**
Cache invalidation paths are hardcoded string templates in every action file. Adding a new page that displays post data requires editing all four files. Missing one produces a stale cache bug that only manifests in production. The two forms (`/post/${id}` and `/post/${id}/${slug}`) are also used inconsistently.

Fix both by creating `src/lib/post-paths.ts`:

```ts
export function postCanonicalPath(postId: string, slug: string): string
export function invalidatePostCaches(postId: string, slug: string): void
```

`invalidatePostCaches` calls all the `revalidatePath` invocations that currently appear across the four action files. Move `postCanonicalPath` here from `app/post/post-detail-data.ts` (delete it there, or re-export from there for any `app/` callers that need it).

Update all four action files to call `invalidatePostCaches(post.id, post.slug)` instead of their individual `revalidatePath` calls.

## Acceptance criteria

- [ ] `src/lib/post-paths.ts` exports `postCanonicalPath` and `invalidatePostCaches`
- [ ] `postCanonicalPath` is no longer defined in `src/app/post/post-detail-data.ts`
- [ ] No `lib/` file imports from `app/`
- [ ] `like-actions.ts`, `comment-actions.ts`, `admin-actions.ts`, `report-actions.ts` call `invalidatePostCaches` instead of individual `revalidatePath` strings
- [ ] No hardcoded `/post/${id}` or `/post/${id}/${slug}` strings remain in action files
- [ ] All existing Playwright tests continue to pass

## Blocked by

None

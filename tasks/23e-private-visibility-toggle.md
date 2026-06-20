# #23e — Private Visibility Toggle for Stories

**Type:** AFK
**Blocked by:** #09 — Post Edit/Delete, #23d — Draft Experience & Later Publish

## What to build

Allow authors to mark an already published story as private, making it invisible on the platform, and later switch it back to public at any time.

This adds a reversible visibility control independent from the draft creation flow:

- Public: visible on platform surfaces
- Private: hidden from all public/discovery surfaces

Main behavior:

- Author can toggle story visibility between public and private
- Visibility change applies immediately
- Author can switch visibility back to public without recreating the story

Suggested model changes:

- Add visibility field (e.g. `public` | `private`) on experience posts
- Keep existing content data unchanged when switching visibility
- Optional `visibilityChangedAt` timestamp for auditing/debugging

## Acceptance criteria

- [ ] A logged-in author can change their own published story visibility to private
- [ ] A logged-in author can change a private story back to public at any time
- [ ] Private stories are excluded from explore feed, search, location pages, tag pages, and public profile views
- [ ] Non-authors cannot access private story detail URLs (404 or forbidden)
- [ ] The author can still access and edit their private stories
- [ ] Visibility status is clearly shown in author-facing UI (e.g. badge or status label)
- [ ] Switching visibility does not delete data, likes, comments, or ratings; it only affects discoverability/access
- [ ] Existing stories default to public during migration/backfill
- [ ] Access control and visibility behavior are covered by automated tests

## Blocked by

- #09 — Post Edit/Delete
- #23d — Draft Experience & Later Publish

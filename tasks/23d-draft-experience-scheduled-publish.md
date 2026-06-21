# #23d — Draft Experience & Later Publish

**Type:** AFK
**Blocked by:** #06 — Post Creation Form Rate Limiting, #09 — Post Edit/Delete

## What to build

Allow users to create an experience as a draft instead of publishing immediately. Drafts are private and can be edited multiple times until the user explicitly publishes them to the platform.

This introduces a two-step content lifecycle:

- Draft (private, editable, not visible in feeds/search/public profile)
- Published (public, visible on platform)

Main behavior:

- User can save a new experience as draft from the create flow
- User can open and edit existing drafts at any time
- User can publish a draft when ready
- Drafts remain invisible to other users until publish

Suggested model changes:

- Post status field (e.g. `draft` | `published`)
- Optional `publishedAt` timestamp set when status changes to `published`

## Acceptance criteria

- [x] A logged-in user can save a new experience as draft (without making it public)
- [x] Draft experiences are visible only to their author
- [x] Draft experiences are excluded from explore feed, profile public view, search, location pages, and tag pages
- [x] The author can edit a draft multiple times before publishing
- [x] The author can publish a draft explicitly via a dedicated action
- [x] On publish, the experience becomes publicly visible across platform surfaces
- [x] Guests and other users cannot access a draft post detail URL (404 or forbidden)
- [x] The UI clearly indicates draft vs published status in author-facing views
- [x] Publishing enforces the same validation rules as normal post publishing
- [x] Existing published posts continue to work unchanged

## Blocked by

- #06 — Post Creation Form Rate Limiting
- #09 — Post Edit/Delete

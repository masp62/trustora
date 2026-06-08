# #10 — Likes

**Type:** AFK
**Blocked by:** #7 — Post Detail Page & Slug URL

## What to build

Implement the like/unlike interaction on Experience Posts. Like count must be visible to all visitors. Authenticated users can toggle their like. Guests who attempt to like are prompted to log in.

## Acceptance criteria

- [ ] Like count is visible on both post cards and the post detail page for all visitors
- [ ] A logged-in user can like a post; the count increments immediately (optimistic update)
- [ ] A logged-in user can unlike a post they previously liked; the count decrements immediately
- [ ] A user cannot like the same post twice (composite unique constraint enforced server-side)
- [ ] A guest who clicks the like button is shown a login prompt (modal or redirect) rather than an error
- [ ] The like button visually reflects the current user's like status (liked vs not liked)

## Blocked by

- #7 — Post Detail Page & Slug URL

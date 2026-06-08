# #17 — Home Feed (Following)

**Type:** AFK
**Blocked by:** #12, #15

## What to build

Build the `/` home feed showing posts exclusively from users the current user follows, in reverse chronological order with infinite scroll. Unauthenticated visitors are redirected to `/explore`. Users who follow nobody see an empty-state prompt. This slice is built in parallel with #16 — both share the approved feed layout from #15.

## Acceptance criteria

- [ ] Authenticated users visiting `/` see posts from the users they follow, sorted reverse-chronologically
- [ ] Posts are displayed in the same card grid format used by the Explore feed
- [ ] Cursor-based infinite scroll loads more posts as the user scrolls
- [ ] A user who follows nobody sees an empty-state prompt with links to discover users or browse `/explore`
- [ ] Unauthenticated visitors to `/` are redirected to `/explore`
- [ ] The feed updates to include new posts from followed users without requiring a manual refresh (re-validating on navigation is sufficient)

## Blocked by

- #12 — Follow / Unfollow
- #15 — HITL: Design Review — Explore Feed, Filters & Empty States

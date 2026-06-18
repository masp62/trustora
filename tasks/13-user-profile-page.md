# #13 — User Profile Page

**Type:** AFK
**Blocked by:** #3, #7

## What to build

Build the public user profile page at `/u/[username]`. Any visitor can view a user's identity, stats, and all their Experience Posts. The page is server-rendered for SEO.

## Acceptance criteria

- [x] Any visitor can view `/u/[username]` without being logged in
- [x] Page displays: avatar, display name, username, bio, location, post count, follower count, following count
- [x] Page displays a grid of all Experience Post cards authored by the user, in reverse chronological order
- [x] Clicking a post card navigates to the post detail page
- [x] Visiting a username that does not exist returns a 404 page
- [x] Page is server-rendered with a meta title and description populated from the user's display name and bio

## Blocked by

- #3 — Auth: Profile Setup & Username Generation
- #7 — Post Detail Page & Slug URL

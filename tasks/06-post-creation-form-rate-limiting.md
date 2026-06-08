# #6 — Post Creation Form & Rate Limiting

**Type:** AFK
**Blocked by:** #3, #5a

## What to build

Build the full Experience Post creation flow end-to-end: the `/create` form, all field validations, photo upload via the image upload pipeline from #5a, server-side rate limiting, and the Server Action that persists the new post. On success, redirect the user to the new post's detail page.

## Acceptance criteria

- [ ] Authenticated users can navigate to `/create` and compose an Experience Post
- [ ] Form fields: title (required, max 120 chars), rich-text body (required, max ~5000 chars), location city + country (required), property name (optional), trip type (required — solo/couple/family/friends/business), up to 5 tags from predefined list, 1–10 photos via image upload pipeline
- [ ] Inline validation messages shown for: missing title, missing body, missing location, no photos uploaded
- [ ] Selecting more than 5 tags is prevented in the UI and rejected server-side
- [ ] Uploading more than 10 photos is prevented in the UI and rejected server-side
- [ ] Server-side rate limit: users who have created 5 posts in the last 24 hours see a clear error and cannot submit
- [ ] On successful submission, user is redirected to the new post's detail page
- [ ] Unauthenticated users attempting to visit `/create` are redirected to `/login`

## Blocked by

- #3 — Auth: Profile Setup & Username Generation
- #5a — Image Upload Pipeline (Local Storage)

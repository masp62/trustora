# #3 — Auth: Profile Setup & Username Generation

**Type:** AFK
**Blocked by:** #2 — Auth: Sign-in

## What to build

After a user signs up for the first time (via either provider), route them to a profile setup screen where they complete their public identity. Google users get their display name and avatar pre-filled. Every new user gets an auto-generated username derived from their display name, with a random suffix appended on collision. On completion, redirect to `/explore` with an onboarding prompt.

## Acceptance criteria

- [x] New users (first sign-in) are routed to a profile setup screen before reaching the app
- [x] Profile setup collects: display name (required), avatar (required), bio (max 280 chars, optional), location (optional)
- [x] Google OAuth users have display name pre-filled from their Google profile
- [x] Google OAuth users have avatar pre-filled from their Google profile photo
- [x] Username is auto-generated from the display name: lowercased, non-alphanumeric characters replaced with hyphens, consecutive hyphens collapsed
- [x] If the generated username is already taken, a random 2-digit suffix is appended (e.g. `markus-42`); retried until unique
- [x] Username is stored on the User record; uniqueness enforced at the database level
- [x] On profile setup completion, user is redirected to `/explore`
- [x] An onboarding prompt is shown on first visit to `/explore` suggesting to follow travelers or create a first post
- [x] Returning users (already completed setup) skip the setup screen

## Blocked by

- #2 — Auth: Sign-in (Google OAuth + Email/Password)

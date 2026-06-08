# #5a — Image Upload Pipeline (Local Storage)

**Type:** AFK
**Blocked by:** #1 — Project Foundation & Full Schema

## What to build

Implement the server-side image upload pipeline behind an abstraction that all post and avatar photo uploads will use. The abstraction allows swapping storage backends via an environment variable (`IMAGE_PROVIDER=local | cloudinary`). This slice implements only the `local` backend, which writes files to `public/uploads/` and serves them statically — no external services required.

This gives post creation and avatar upload a fully functional image pipeline during local development without needing a Cloudinary account.

## Acceptance criteria

- [ ] An `uploadImage` abstraction is defined (e.g. accepts file data, returns `{ url: string }`) and selects the backend based on `IMAGE_PROVIDER` env var
- [ ] The `local` backend writes accepted files to `public/uploads/` with unique filenames and returns the local URL path
- [ ] A server-side upload endpoint (API route or Server Action) accepts image file data and delegates to the abstraction
- [ ] Accepted file types enforced server-side (JPEG, PNG, WebP only)
- [ ] File size limit enforced server-side (e.g. 5 MB)
- [ ] Photo count limits (min 1, max 10 per post) documented and ready for enforcement in the post creation slice
- [ ] Upload endpoint is not publicly accessible without authentication (requires a session)
- [ ] `.env.example` updated with `IMAGE_PROVIDER=local`
- [ ] `public/uploads/` is added to `.gitignore`

## Blocked by

- #1 — Project Foundation & Full Schema

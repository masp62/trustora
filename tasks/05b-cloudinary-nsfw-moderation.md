# #5b — Cloudinary Integration & NSFW Moderation

**Type:** HITL
**Blocked by:** #5a — Image Upload Pipeline (Local Storage)

## What to build

Add the `cloudinary` backend to the image upload abstraction from #5a. This includes creating a Cloudinary account, enabling the NSFW moderation add-on, and implementing the Cloudinary SDK upload with moderation checks. When `IMAGE_PROVIDER=cloudinary`, uploads go to Cloudinary instead of local storage, NSFW-flagged images are rejected, and accepted images are returned as CDN URLs with transformation parameters.

This slice is HITL because it requires manual Cloudinary account setup, enabling the moderation add-on, and configuring API credentials.

## Acceptance criteria

- [ ] Cloudinary account created and NSFW moderation add-on enabled
- [ ] The `cloudinary` backend is implemented behind the existing `uploadImage` abstraction from #5a
- [ ] Uploads are sent to Cloudinary via the server-side SDK (not client-side)
- [ ] Images flagged as NSFW by Cloudinary moderation are rejected; the client receives a clear error message and no CDN URL is stored
- [ ] Accepted uploads return a Cloudinary CDN URL with transformation parameters (responsive sizing, format optimisation)
- [ ] All file type and size validations from #5a still apply before hitting the Cloudinary API
- [ ] Cloudinary API keys and upload preset stored as environment variables; `.env.example` updated
- [ ] Setting `IMAGE_PROVIDER=cloudinary` in `.env` switches all uploads to Cloudinary without code changes

## Blocked by

- #5a — Image Upload Pipeline (Local Storage)

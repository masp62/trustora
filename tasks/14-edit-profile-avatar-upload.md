# #14 — Edit Profile & Avatar Upload

**Type:** AFK
**Blocked by:** #13 — User Profile Page

## What to build

Allow logged-in users to edit their own profile at `/u/[username]/edit`. Editable fields include display name, bio, location, username, and avatar. Avatar upload uses the same image upload pipeline as post photos (#5a). Username changes enforce uniqueness.

## Acceptance criteria

- [x] The edit profile page is accessible at `/u/[username]/edit` and restricted to the profile owner
- [x] Form pre-populates current values for: display name, bio (max 280 chars), location, username
- [x] Submitting a username that is already taken shows an inline error message; the form is not submitted
- [x] Username changes are reflected immediately in the profile URL (redirect to new `/u/[new-username]`)
- [x] Users can upload a new avatar from their device; the image is sent through the image upload pipeline
- [x] Uploaded avatar replaces the existing avatar in the database and is immediately visible on the profile page
- [x] Non-owners attempting to access another user's edit page are rejected with a 403
- [x] Unauthenticated users attempting to access any edit profile page are redirected to `/login`

## Blocked by

- #13 — User Profile Page

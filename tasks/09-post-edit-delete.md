# #9 — Post Edit & Delete

**Type:** AFK
**Blocked by:** #6 — Post Creation Form & Rate Limiting

## What to build

Allow post authors to edit or delete their own Experience Posts. Non-authors and unauthenticated users must be prevented from accessing these actions at both the UI and server layers.

## Acceptance criteria

- [x] A post author sees edit and delete controls on their own post detail page (not visible to other users or guests)
- [x] The edit form pre-populates all existing post fields: title, body, photos, location, property name, trip type, tags
- [x] Authors can add or remove photos within the 1–10 photo constraint during edit
- [x] Submitting the edit form persists changes and redirects back to the updated post detail page
- [x] Deleting a post requires confirmation via a dialog before the delete Server Action is called
- [x] After deletion, the user is redirected to their profile page
- [x] Non-authors attempting to access the edit route are rejected with a 403 response
- [x] Unauthenticated users attempting to access the edit route are redirected to `/login`

## Blocked by

- #6 — Post Creation Form & Rate Limiting

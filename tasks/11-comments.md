# #11 — Comments

**Type:** AFK
**Blocked by:** #7 — Post Detail Page & Slug URL

## What to build

Implement the comments section on the Experience Post detail page. Authenticated users can post and delete their own comments. Comments are displayed to all visitors in chronological order. Guests who attempt to comment are prompted to log in.

## Acceptance criteria

- [x] All comments on a post are displayed in reverse chronological order (newest first) on the post detail page for all visitors
- [x] A logged-in user can submit a comment via a text input on the post detail page
- [x] A submitted comment appears immediately in the comment list without a full page reload
- [x] A comment author sees a delete control on their own comments (not visible to others)
- [x] Deleting a comment removes it immediately from the list
- [x] A guest who attempts to interact with the comment input is shown a login prompt
- [x] Empty comment submissions are rejected with a validation message

## Blocked by

- #7 — Post Detail Page & Slug URL

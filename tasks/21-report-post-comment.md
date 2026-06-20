# #21 — Report Post & Comment

**Type:** AFK
**Blocked by:** #10, #11

## What to build

Allow logged-in users to report an Experience Post or a comment as inappropriate. Each report is persisted with a "pending" status for review by an admin. Users receive confirmation that their report was submitted.

## Acceptance criteria

- [x] A logged-in user can report a post via a "Report" control on the post detail page
- [x] A logged-in user can report a comment via a "Report" control on each comment
- [x] Submitting a report persists a Report record with: reporterId, targetType (post | comment), targetId, optional reason text, status = pending
- [x] The user sees a confirmation message after successfully submitting a report
- [x] Guests do not see report controls and cannot submit reports
- [x] A user cannot report the same target more than once (duplicate reports from the same user are silently ignored or shown as "already reported")

## Blocked by

- #10 — Likes
- #11 — Comments

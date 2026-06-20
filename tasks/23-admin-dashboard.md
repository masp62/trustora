# #23 — Admin Dashboard

**Type:** AFK
**Blocked by:** #22 — HITL: Design Review — Admin Dashboard

## What to build

Build the admin moderation dashboard at `/admin`, accessible only to users with `role = admin`. Admins can review the pending report queue and take moderation actions: remove a post, remove a comment, ban a user, or dismiss a report as unfounded.

## Acceptance criteria

- [x] `/admin` returns a 403 (or redirects to home) for any user whose role is not `admin`
- [x] The report queue lists all reports with status = pending, showing: reported content preview, reporter username, report date, optional reason, and the target type (post | comment)
- [x] An admin can remove a reported post — the post is deleted from the platform
- [x] An admin can remove a reported comment — the comment is deleted from the platform
- [x] An admin can ban a user — the user's `role` or a `banned` flag is updated to prevent further post/comment creation
- [x] An admin can dismiss a report — the report status is updated to `dismissed` and it leaves the queue
- [x] Destructive actions (remove, ban) require a confirmation step before executing
- [x] Resolving a report (via remove or dismiss) moves it out of the pending queue
- [x] A banned user who attempts to create a post or comment receives a clear rejection message

## Blocked by

- #22 — HITL: Design Review — Admin Dashboard

# Admin Dashboard Design Review (Story #22)

Date: 2026-06-20
Status: Approved for implementation in Story #23
Scope: Internal moderation UI at `/admin`

## Review decision summary

The admin dashboard design is approved with the decisions below. Story #23 can now implement against this spec without further design clarification.

## 1) Report queue layout

Decision: Use a table on desktop and stacked cards on mobile.

Required fields per pending report:
- Report ID (shortened)
- Target type (`post` or `comment`)
- Target preview:
  - post: post title + first ~120 chars of body
  - comment: first ~120 chars of comment body
- Reporter username
- Optional reason text (truncate to ~140 chars with expand)
- Submitted at timestamp (locale formatted)
- Primary actions (Dismiss, Remove + Resolve, Ban + Resolve)

Sorting and pagination:
- Default sort: `createdAt DESC` (newest first)
- Secondary sort: `id DESC` for stable ordering
- Pagination: cursor-based, 25 items per page
- Queue filter tabs: `Pending` (default), `Dismissed`, `Resolved` (read-only history views)

## 2) Moderation actions and placement

Decision: Keep all actions inline in each queue row/card.

Actions:
- Dismiss Report (non-destructive): sets report status to `dismissed`
- Remove Post + Resolve: deletes post and marks report as `resolved`
- Remove Comment + Resolve: deletes comment and marks report as `resolved`
- Ban User + Resolve: sets `isBanned = true` and marks report as `resolved`

Action labels (exact):
- `Dismiss`
- `Remove post`
- `Remove comment`
- `Ban user`

Visual priority:
- Dismiss = neutral secondary button
- Remove/Ban = destructive button style

## 3) Confirmation requirements

Decision: All destructive actions require explicit confirmation.

Required confirmation UX:
- Dismiss: no confirmation modal needed
- Remove post/comment: modal with summary + typed confirmation `REMOVE`
- Ban user: modal with summary + typed confirmation `BAN`
- Confirm button disabled until typed token matches exactly
- Confirmation modal must mention irreversible impact clearly

## 4) Banned user state

Decision:
- Ban represented by `isBanned = true`
- Ban is reversible in future, but unban is out of scope for Story #23
- In Story #23 acceptance, banned users must be blocked from post/comment creation with a clear message

## 5) Admin navigation

Decision:
- Add `Admin` navigation entry only for users with `role = admin`
- Desktop: visible in main nav
- Mobile: visible in user/menu navigation
- Route structure for now:
  - `/admin` (queue)
- Optional future routes (not required in #23): `/admin/reports/[id]`, `/admin/users/[id]`

## 6) Access control UX

Decision:
- Non-admin authenticated users accessing `/admin` should receive 403 UX via existing forbidden page
- Guests should be redirected to sign-in flow (existing auth guard behavior)
- Message tone: concise and non-technical

## 7) Empty, loading, and error states

Decision:
- Empty pending queue: “No pending reports. Moderation queue is clear.”
- Loading: row/card skeleton placeholders
- Error: inline retry block with “Retry” action

## 8) Story #23 implementation checklist inputs

Implementation in #23 should include:
- Server-side role guard for `/admin`
- Pending queue query and render according to fields above
- Action handlers for dismiss/remove/ban with confirmation constraints
- Resolve behavior removes item from pending queue immediately
- Banned-user enforcement for post/comment creation

## Final review outcome

Approved. No open design change requests remain. Story #23 may start.

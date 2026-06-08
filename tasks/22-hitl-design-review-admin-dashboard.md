# #22 — HITL: Design Review — Admin Dashboard

**Type:** HITL
**Blocked by:** #21 — Report Post & Comment

## What to build

Design review checkpoint. Review and approve the admin dashboard UI before it is implemented. The admin dashboard is a moderation tool, not a public surface — clarity and efficiency of moderation actions take priority over aesthetics.

Aspects to evaluate:

- **Report queue:** table or card list of pending reports — what columns/fields are shown (reported content preview, reporter, date, reason), how the queue is sorted and paginated
- **Moderation actions:** placement and labeling of Remove Post, Remove Comment, Ban User, and Dismiss Report — confirmation step requirements
- **Banned user state:** how a ban is represented, whether it is reversible
- **Admin navigation:** how admins reach `/admin` and any sub-sections
- **Access control UX:** what non-admin users see if they somehow reach `/admin`

## Acceptance criteria

- [ ] Report queue layout reviewed and approved (or change requests issued)
- [ ] Moderation action controls (remove, ban, dismiss) reviewed and approved (or change requests issued)
- [ ] Confirmation step requirements for destructive actions agreed upon
- [ ] Admin navigation structure approved
- [ ] All design change requests resolved before #23 (Admin Dashboard implementation) is started

## Blocked by

- #21 — Report Post & Comment

# #23b — HITL: Design Review — Accommodation Rating UX

**Type:** HITL
**Blocked by:** #23a — Admin Analytics Overview

## What to build

Design review checkpoint for the accommodation rating experience before implementation. The goal is to align on scoring model, wording, interaction pattern, and trust signals so the implementation in #23c can proceed without open UX questions.

Aspects to evaluate:

- **Scoring model:** overall score scale (1.0–5.0 with 0.5 steps), category score scale (1–5 integer), and "would stay again" flag
- **Category taxonomy:** cleanliness, accuracy, check-in, communication, location, value, comfort, facilities
- **Input UX:** star/range controls, category order, optional free text length, validation and required fields
- **Display UX:** placement on post detail page, aggregate breakdown style, reviewer card format, verified-stay badge treatment
- **Sorting/filtering UX:** newest first default, verified-only toggle/filter behavior
- **Mobile behavior:** readability and interaction quality on small screens

## Acceptance criteria

- [ ] Scoring model and category taxonomy reviewed and approved (or change requests issued)
- [ ] Submission form UX (controls, validation, copy) reviewed and approved
- [ ] Post-detail display UX for aggregate + individual ratings reviewed and approved
- [ ] Verified-stay badge behavior and wording reviewed and approved
- [ ] Sorting/filter behavior reviewed and approved
- [ ] All design change requests resolved before #23c starts

## Blocked by

- #23a — Admin Analytics Overview

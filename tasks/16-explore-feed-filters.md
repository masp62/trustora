# #16 — Explore Feed & Filters

**Type:** AFK
**Blocked by:** #15 — HITL: Design Review — Explore Feed, Filters & Empty States

## What to build

Build the `/explore` page — a publicly accessible feed of all Experience Posts with combinable filters and infinite scroll. This is the primary discovery surface for unauthenticated visitors and logged-in users who want to browse beyond their following list.

## Acceptance criteria

- [x] Any visitor can browse `/explore` without being logged in
- [x] Posts are displayed in the approved card grid format (2–3 columns desktop, 1 column mobile)
- [x] Default sort: recency with engagement (likes + comments) as a secondary signal
- [x] Filters available and combinable: location country (text/dropdown), location city (text input), trip type (solo/couple/family/friends/business), tag (multi-select from predefined list)
- [x] Applying filters updates the results without a full page reload
- [x] Cursor-based infinite scroll loads more posts as the user scrolls; skeleton cards shown while loading
- [x] An empty state is shown when the active filters return no results
- [x] Filter state is reflected in the URL query string so filtered views are shareable and bookmarkable

## Blocked by

- #15 — HITL: Design Review — Explore Feed, Filters & Empty States

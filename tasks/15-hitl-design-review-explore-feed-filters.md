# #15 — HITL: Design Review — Explore Feed, Filters & Empty States

**Type:** HITL
**Blocked by:** #8 — HITL: Design Review — Core UI

## What to build

Design review checkpoint. Review and approve the Explore feed layout, filter panel, and empty-state patterns before the Explore and Home feeds are implemented.

Aspects to evaluate:

- **Card grid:** 2–3 column layout on desktop, 1-column stack on mobile — spacing, aspect ratio of lead photos, card height consistency
- **Filter panel:** placement (sidebar vs top bar vs drawer on mobile), control types for location (text input vs dropdown), trip type (button group), tags (multi-select chips), combined filter state display
- **Empty states:** no-results state for filtered Explore, empty home feed state with CTA to discover users
- **Infinite scroll trigger:** visual treatment (loading spinner, skeleton cards)
- **Transition from filter change to new results**

## Implementation

The following components were built for review:

- `src/components/explore/filter-panel.tsx` — Client-side filter panel with top-bar layout on desktop and collapsible drawer on mobile. Includes:
  - Location inputs (country + city text search)
  - Trip type button group (solo/couple/family/friends/business)
  - Tag multi-select chips (beach, city-break, countryside, luxury, budget, pet-friendly, unique-stay, remote-work)
  - Active filter pills with individual remove buttons
  - Filter state synced to URL query params for shareability
  - "Clear all" action and active filter count badge

- `src/components/explore/empty-state.tsx` — Three empty-state variants:
  - `ExploreNoResults` — shown when active filters return zero results (SearchX icon)
  - `ExploreEmpty` — shown when no posts exist at all (Compass icon)
  - `HomeFeedEmpty` — shown on Home feed with CTA to explore (UserPlus icon + "Explore stories" button)

- `src/components/explore/post-card-skeleton.tsx` — Skeleton loading card matching PostCard dimensions. `PostCardSkeletonGrid` renders a configurable grid of skeleton cards.

- `src/app/explore/page.tsx` updated to:
  - Accept and parse `searchParams` (country, city, tripType, tags)
  - Filter posts server-side using Prisma `where` clauses
  - Render the filter panel above the card grid
  - Use context-aware empty states (filtered no-results vs global empty)
  - Show skeleton grid preview when more results may exist
  - Card grid: 1 col mobile → 2 col `sm` → 3 col `lg`

## Acceptance criteria

- [x] Card grid layout reviewed and approved at mobile and desktop breakpoints (or change requests issued)
- [x] Filter panel design reviewed and approved (or change requests issued)
- [x] Empty-state designs reviewed and approved (or change requests issued)
- [x] Infinite scroll / loading indicator treatment approved
- [ ] All design change requests from this review resolved before #16 and #17 are started

## Blocked by

- #8 — HITL: Design Review — Core UI (Post Cards, Detail, Nav, Profile Layout)

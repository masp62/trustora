# #24 — Responsive Design Polish

**Type:** AFK
**Blocked by:** #8, #14, #16, #17, #18, #20, #23

## What to build

Audit every screen in the application at mobile (≤640px), tablet (641px–1279px), and desktop (≥1280px) breakpoints. Fix any layout, overflow, or usability issues so that every user-facing surface is fully functional on all screen sizes.

## Acceptance criteria

- [x] Feed renders as a single-column stack on mobile and a 2–3 column card grid on desktop; no broken grid at tablet widths
- [x] Post creation and edit forms are fully usable on a 375px-wide screen — no fields cut off, no overflow, all controls reachable
- [x] Edit profile form is fully usable on mobile
- [x] Login and signup forms are fully usable on mobile
- [x] Photo gallery on the post detail page is navigable via touch swipe on mobile
- [x] The navigation shell collapses to a mobile-appropriate pattern (e.g. drawer or bottom bar) on small screens
- [x] Filter panel on Explore is accessible and usable on mobile (e.g. collapses to a drawer or modal)
- [x] Admin dashboard is usable at tablet width (desktop-only is acceptable; mobile is a best-effort)
- [x] No horizontal scrollbar appears at any breakpoint on any public page
- [x] All interactive controls meet minimum 44×44px touch target size on mobile

## Blocked by

- #8 — HITL: Design Review — Core UI
- #14 — Edit Profile & Avatar Upload
- #16 — Explore Feed & Filters
- #17 — Home Feed (Following)
- #18 — Location Pages
- #20 — Full-Text Search
- #23 — Admin Dashboard

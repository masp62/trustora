# #19 — Tag Pages

**Type:** AFK
**Blocked by:** #7 — Post Detail Page & Slug URL

## What to build

Build tag discovery pages at `/explore/tags/[tag]` for each of the 8 predefined tags. Each page lists all posts carrying that tag, server-rendered with SEO metadata. Pages are generated from the fixed tag set seeded in #1.

## Acceptance criteria

- [ ] `/explore/tags/[tag]` is accessible for each predefined tag: beach, city-break, countryside, luxury, budget, pet-friendly, unique-stay, remote-work
- [ ] Each tag page lists all Experience Posts with that tag, using the standard post card format, sorted reverse-chronologically
- [ ] Visiting a tag slug that is not in the predefined set returns a 404
- [ ] Each page is server-rendered with a unique meta title (e.g. "Beach Experiences — RealBnB"), meta description, and Open Graph tags
- [ ] Tag pages are accessible without authentication

## Blocked by

- #7 — Post Detail Page & Slug URL

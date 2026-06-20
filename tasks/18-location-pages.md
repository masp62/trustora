# #18 — Location Pages (City + Country)

**Type:** AFK
**Blocked by:** #7 — Post Detail Page & Slug URL

## What to build

Build auto-generated location discovery pages at `/explore/[country]` (country level) and `/explore/[country]/[city]` (city level). Pages are created dynamically whenever at least one post exists for that location. Each page is server-rendered with full SEO metadata.

## Acceptance criteria

- [x] `/explore/[country]` lists all Experience Posts for a given country, using the post card format
- [x] `/explore/[country]/[city]` lists all Experience Posts for a given city within that country
- [x] Both pages are generated dynamically — no manual content management needed; a page exists as soon as a post with that location is created
- [x] Visiting a location URL with no matching posts returns a 404
- [x] Each page is server-rendered with a unique meta title (e.g. "Experiences in Lisbon, Portugal"), meta description, and Open Graph tags
- [x] Country slugs and city slugs are derived from the stored `locationCountry` and `locationCity` fields (lowercased, spaces to hyphens)

## Blocked by

- #7 — Post Detail Page & Slug URL

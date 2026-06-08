# #20 — Full-Text Search

**Type:** AFK
**Blocked by:** #7 — Post Detail Page & Slug URL

## What to build

Build a search results page at `/search?q=[query]` that matches Experience Posts against their title, body, and location fields. Results use the standard post card format. The page is accessible without authentication.

## Acceptance criteria

- [ ] Any visitor can search via `/search?q=[query]`
- [ ] Search matches against: post title, body text, `locationCity`, and `locationCountry`
- [ ] Results are displayed as post cards in the same format used by the Explore feed
- [ ] Results are sorted by relevance; reverse-chronological as a fallback for equal relevance
- [ ] An empty state is shown when the query returns no results
- [ ] The search query is preserved in the URL so results are shareable and bookmarkable
- [ ] A search input in the navigation shell submits to `/search?q=`
- [ ] Page is server-rendered so search-engine crawlers can index popular query result pages

## Blocked by

- #7 — Post Detail Page & Slug URL

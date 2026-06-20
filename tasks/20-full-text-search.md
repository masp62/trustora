# #20 — Full-Text Search

**Type:** AFK
**Blocked by:** #7 — Post Detail Page & Slug URL

## What to build

Build a search results page at `/search?q=[query]` that matches Experience Posts against their title, body, and location fields. Results use the standard post card format. The page is accessible without authentication.

## Acceptance criteria

- [x] Any visitor can search via `/search?q=[query]`
- [x] Search matches against: post title, body text, `locationCity`, and `locationCountry`
- [x] Results are displayed as post cards in the same format used by the Explore feed
- [x] Results are sorted by relevance; reverse-chronological as a fallback for equal relevance
- [x] An empty state is shown when the query returns no results
- [x] The search query is preserved in the URL so results are shareable and bookmarkable
- [x] A search input in the navigation shell submits to `/search?q=`
- [x] Page is server-rendered so search-engine crawlers can index popular query result pages

## Blocked by

- #7 — Post Detail Page & Slug URL

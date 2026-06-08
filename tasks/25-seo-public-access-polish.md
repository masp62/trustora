# #25 — SEO & Public Access Polish

**Type:** AFK
**Blocked by:** #7, #13, #18, #19, #20

## What to build

Audit all public-facing pages to ensure they are fully server-rendered, carry correct and unique SEO metadata, and are accessible without authentication. Fix any pages that serve a loading spinner on first paint or have missing/duplicate meta tags.

## Acceptance criteria

- [ ] All public pages (post detail, user profile, explore feed, location pages, tag pages, search results) are server-rendered — the HTML returned to the browser contains real content, not a loading spinner
- [ ] Every public page has a unique `<title>` tag
- [ ] Every public page has a `<meta name="description">` tag with meaningful content derived from page data
- [ ] Every public page has Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`) populated from page data
- [ ] Post detail pages use the first post photo as `og:image`
- [ ] User profile pages use the user's avatar as `og:image`
- [ ] Unauthenticated users can access all read routes (posts, profiles, explore, location pages, tag pages, search) without being redirected to login
- [ ] Canonical `<link rel="canonical">` tags are present on all public pages
- [ ] `/robots.txt` allows crawling of all public pages

## Blocked by

- #7 — Post Detail Page & Slug URL
- #13 — User Profile Page
- #18 — Location Pages (City + Country)
- #19 — Tag Pages
- #20 — Full-Text Search

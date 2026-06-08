# #7 — Post Detail Page & Slug URL

**Type:** AFK
**Blocked by:** #6 — Post Creation Form & Rate Limiting

## What to build

Build the public Experience Post detail page at `/post/[id]/[slug]`. The page must be fully server-rendered for SEO, display all post content (photos, story, metadata, author, likes, comments), and handle slug redirects so that any link to a post always resolves to the canonical URL.

## Acceptance criteria

- [ ] Any visitor (logged in or not) can view a post at `/post/[id]/[slug]`
- [ ] Page renders: photo gallery (browsable), title, rich-text body, location (city + country), property name (if set), tags as chips, trip type, author avatar + display name + username, like count, and comments section
- [ ] Visiting `/post/[id]` or `/post/[id]/wrong-slug` redirects (308) to the canonical `/post/[id]/[correct-slug]`
- [ ] Author name and avatar link to `/u/[username]`
- [ ] Page is server-rendered (SSR); meta title, description, and Open Graph tags populated from post data
- [ ] Photo gallery allows browsing through all uploaded images

## Blocked by

- #6 — Post Creation Form & Rate Limiting

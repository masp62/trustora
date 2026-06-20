# #23a — Admin Analytics Overview

**Type:** AFK
**Blocked by:** #23 — Admin Dashboard

## What to build

Extend the admin dashboard at `/admin` with an analytics overview section showing key platform metrics and usage data. The overview gives admins a quick health check of platform activity without needing external analytics tools.

The analytics section should be accessible as the default landing view when an admin visits `/admin`, with the report queue available via a tab or sub-navigation.

## Proposed metrics

### Platform totals (counters)

- Total users (registered accounts)
- Total posts (published experience posts)
- Total comments
- Total likes
- Active reports (status = pending)
- Banned users

### Activity over time (last 30 days)

- New user registrations per day
- New posts per day
- New comments per day
- New reports per day

### Top content

- Top 5 most liked posts (title, author, like count)
- Top 5 most commented posts (title, author, comment count)

### User engagement

- Most active authors (top 5 by post count)
- Most active commenters (top 5 by comment count)

### Geographic distribution

- Top 10 countries by post count
- Top 10 cities by post count

## Acceptance criteria

- [x] `/admin` shows an analytics overview section with platform total counters
- [x] The overview displays activity charts or lists for the last 30 days (registrations, posts, comments, reports)
- [x] Top liked and top commented posts are shown with title, author, and count
- [x] Most active users (by posts and comments) are listed
- [x] Geographic distribution of posts is shown (top countries and cities)
- [x] The report queue remains accessible via tab navigation (`Overview` | `Reports`)
- [x] All data is fetched server-side; no client-side analytics dependencies required
- [x] Non-admin users still receive 403 when accessing `/admin`

## Blocked by

- #23 — Admin Dashboard

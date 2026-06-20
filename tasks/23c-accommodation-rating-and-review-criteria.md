# #23c — Accommodation Rating & Review Criteria

**Type:** AFK
**Blocked by:** #07 — Post Detail Page Slug URL, #23b — HITL: Design Review — Accommodation Rating UX, #26 — Verified Stay Review Authenticity

## What to build

Introduce an accommodation rating that is provided by the story creator as part of creating or editing a stay post.

The goal is to quickly communicate how the author rates the accommodation itself, with an overall star score and category breakdown.

Rating model:

- Overall score: 1 to 5 stars (integer)
- Category scores: 1 to 5 stars for cleanliness, accuracy, check-in, communication, location, value, comfort, facilities
- Overall score is calculated automatically as the equally weighted average of all category scores
- Rating is entered by the post author when publishing/editing the story
- Visitors do not submit ratings for this story

Display behavior:

- Post detail page shows the creator-provided star rating clearly in the story content
- Rating is displayed as stars with numeric value (e.g. 4/5)
- Category ratings are shown in a clear breakdown list (value/5 per category)

Review integrity rules:

- One accommodation rating per post (owned by the author)
- Author can update the rating when editing the post
- Visitors and guests cannot submit a separate accommodation rating

## Acceptance criteria

- [x] Story creator can set an accommodation rating (1-5 stars) while creating a post
- [x] Story creator can set category ratings (1-5 stars) while creating a post
- [x] Overall rating is derived automatically from category ratings (equal weights)
- [x] Story creator can update the accommodation rating while editing a post
- [x] Story creator can update category ratings while editing a post
- [x] Visitors and guests cannot submit their own accommodation ratings for the story
- [x] Post detail page displays the creator-provided star rating clearly
- [x] Rating is rendered as stars and numeric value (e.g. 4/5)
- [x] Post detail page displays creator-provided category ratings

## Blocked by

- #07 — Post Detail Page Slug URL
- #23b — HITL: Design Review — Accommodation Rating UX
- #26 — Verified Stay Review Authenticity

# #23c — Accommodation Rating & Review Criteria

**Type:** AFK
**Blocked by:** #07 — Post Detail Page Slug URL, #23b — HITL: Design Review — Accommodation Rating UX, #26 — Verified Stay Review Authenticity

## What to build

Introduce a structured accommodation rating system for each stay post, inspired by common patterns from Airbnb, Booking.com, and similar platforms. Logged-in users can submit one overall rating and detailed category ratings, plus optional text feedback.

The goal is to make reviews more comparable and useful by separating quality dimensions (cleanliness, accuracy, value, etc.) instead of relying only on free text.

Rating model proposal:

- Overall score: 1.0 to 5.0 (0.5 steps)
- Category scores: 1 to 5 (integer)
- Optional recommendation flag: "Would stay again"
- Optional written feedback (short text)
- Optional "Verified stay" marker from #26 shown next to the review

Suggested category criteria (based on Airbnb/Booking patterns):

- Cleanliness
- Accuracy of listing (photos/description vs reality)
- Check-in experience
- Communication with host
- Location
- Value for money
- Comfort (sleep quality, noise, temperature)
- Facilities & amenities (Wi-Fi, kitchen, bathroom, etc.)

Display behavior:

- Post detail page shows aggregated overall score and number of ratings
- Category averages are shown as a breakdown (e.g. bars or list)
- Individual review entries show overall score, category scores summary, optional text, reviewer, date, and verified badge if applicable

Review integrity rules:

- One rating per user per post (user can edit their own rating later)
- Guests (not logged in) cannot submit ratings
- If verified stay exists, review is marked as verified; otherwise unverified

## Acceptance criteria

- [ ] A logged-in user can submit an overall accommodation rating for a post
- [ ] A logged-in user can submit category ratings for all defined criteria
- [ ] Optional review text and "Would stay again" can be submitted
- [ ] A user can only have one rating per post (duplicate creates are prevented; update flow is supported)
- [ ] Guests do not see rating submission controls and cannot submit ratings
- [ ] The post detail page shows aggregated overall rating and total rating count
- [ ] The post detail page shows category-average breakdown
- [ ] Individual ratings list shows reviewer, date, overall score, category summary, optional text
- [ ] Verified-stay status (from #26) is displayed on ratings where applicable
- [ ] Sorting defaults to newest ratings first, with optional filter for verified-only

## Blocked by

- #07 — Post Detail Page Slug URL
- #23b — HITL: Design Review — Accommodation Rating UX
- #26 — Verified Stay Review Authenticity

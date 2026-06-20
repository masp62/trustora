# Accommodation Rating Design Review (Story #23b)

Date: 2026-06-20
Status: Approved for implementation in Story #23c
Scope: Creator-provided accommodation rating UX on create/edit + post detail pages

## Review decision summary

The accommodation rating experience is approved with the decisions below. Story #23c can implement against this spec without additional UX clarification.

## 1) Scoring model

Decision:
- Overall score: 1 to 5 stars (integer)
- Category scores: 1 to 5 stars for cleanliness, accuracy, check-in, communication, location, value, comfort, facilities
- Overall score is derived automatically from category scores with equal weighting
- Rating is authored by the story creator
- No visitor review submission in this slice

Rationale:
- This score is part of the story metadata and should be fast to provide.
- Star input is familiar and lightweight for authors.

Validation rules:
- Overall score is computed (not manually entered)
- All category scores required

## 2) Input UX

Decision: Add a star selector to create and edit story forms.

Controls:
- 5 clickable stars
- Selected state fills stars from left to right
- Numeric helper text shown (e.g. `4/5`)
- Category rating rows with 5-star input each

## 3) Submission UX

Decision: Keep submission inside create/edit story forms.

Input controls:
- Category scores: 5-star controls for all 8 categories

Formula:
- `overall = (cleanliness + accuracy + checkIn + communication + location + value + comfort + facilities) / 8`
- Display rounded to one decimal (e.g. `4.3/5`)

Required copy:
- Label: "Your accommodation rating"

Error handling:
- Inline validation when no star is selected
- Inline validation when any category rating is missing

Editing behavior:
- Author rating is prefilled in edit form
- Edit updates the same per-post author rating

## 4) Post-detail display UX

Decision: Render one creator-rating block on post detail page, above comments.

Display:
- Show stars + numeric value (e.g. `4/5`)
- Supporting text: rating is provided by the story creator
- Show category breakdown list with per-category score (e.g. `Cleanliness 4/5`)

## 5) Ownership rules

Decision:
- Only the story creator can set/update the accommodation rating
- Visitors cannot submit their own accommodation rating for the post

## 6) Mobile behavior

Decision:
- Star controls and display stay fully usable at small widths
- Touch targets minimum 44x44px for star controls

Mobile constraints:
- No horizontal scrolling in rating module

## 7) Accessibility and trust signals

Decision:
Decision:
- Star controls expose selected state (`aria-checked` / radio semantics)
- Keyboard-operable star controls
- Error messages linked via `aria-describedby`

Trust and integrity messaging:
- Inline note on detail page: rating is authored by the story creator

## 8) Out of scope for #23c

- Visitor-submitted accommodation reviews
- Verified-stay badge in public rating cards

## 9) Implementation checklist inputs for Story #23c

Story #23c implementation should include:
- Required 1-5 star rating in create story form
- Required category star ratings in create story form
- Prefilled and editable 1-5 star rating in edit story form
- Prefilled and editable category ratings in edit story form
- Post detail rendering of creator-provided stars
- Post detail rendering of creator-provided category breakdown
- Server-side enforcement that rating belongs to the post author

## Final review outcome

Approved. No open UX change requests remain. Story #23c may start.

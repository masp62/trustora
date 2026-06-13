# #26 — Verified Stay Review Authenticity

**Type:** AFK
**Blocked by:** None

## What to build

Introduce a review-authenticity layer so only users who actually completed a real booking for a listing can submit a review for that stay. A review must be tied to a specific booking record, and the system must prevent fake or duplicate review attempts.

## Acceptance criteria

- [ ] A user can submit a review only if they have a booking for that listing with status `completed` and a checkout date in the past
- [ ] Review creation requires a `bookingId`, and the server verifies that the booking belongs to the authenticated user
- [ ] One completed booking can create at most one review (no duplicate reviews per booking)
- [ ] Users without a qualifying completed booking are blocked at both UI and server layers from submitting a review
- [ ] Reviews created from verified bookings are marked with a `verifiedStay` flag and displayed with a visible "Verified stay" badge
- [ ] Attempted tampering (forged `bookingId`, cross-user booking reference, or listing mismatch) is rejected server-side with a clear authorization/validation error
- [ ] If a booking is canceled or not completed, it cannot be used to create a review
- [ ] Admin tooling (read-only) can inspect which review maps to which booking for moderation/audit purposes

## Blocked by

- None

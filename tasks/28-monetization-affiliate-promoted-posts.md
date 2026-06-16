# #28 — Monetization: Affiliate Links & Promoted Posts

**Type:** HITL
**Blocked by:** #27 — Booking Platform Integration

## What to build

Implement the first two revenue streams for RealBnB, ranked by feasibility:

### Tier 1 — Affiliate Links to Booking Platforms (highest feasibility)

Every post already has `propertyName`, `locationCity`, and `locationCountry`. Add an affiliate link widget to each post detail page that deep-links to the mentioned property on partner booking platforms (Booking.com Affiliate Partner, Airbnb Associates, etc.). Revenue: 25–40 % commission per booking.

### Tier 2 — Promoted Posts / Sponsored Placements

Property owners or hosts pay to have their post appear at the top of the Explore feed. Add an `isPromoted` flag to `ExperiencePost`, a small "Promoted" badge in the UI, and sorting logic that surfaces promoted posts first.

### Future tiers (not in scope for this task)

3. **Verified Unterkünfte (SaaS for Hosts)** — Hosts pay monthly to claim a property profile, respond to reviews, and display a Verified badge. Foundation exists in #26.
4. **Premium User Subscription** — Power users pay for advanced features (travel stats, unlimited uploads, exclusive filters). Requires Stripe integration.
5. **Local Experience Marketplace** — Users offer local tours/experiences, platform takes a transaction fee. Requires full booking/payment/cancellation system.

## Acceptance criteria

- [ ] Post detail page shows an affiliate link widget when `propertyName` is present
- [ ] Affiliate links use proper `rel="sponsored noopener"` and `target="_blank"` attributes
- [ ] Affiliate partner ID is configurable via environment variable (e.g. `BOOKING_AFFILIATE_ID`)
- [ ] `ExperiencePost` schema has an `isPromoted` boolean field (default `false`)
- [ ] Promoted posts appear before non-promoted posts in the Explore feed (within the same sort order)
- [ ] Promoted posts display a subtle "Promoted" badge on the post card
- [ ] Admin dashboard (#23) allows toggling the `isPromoted` flag on any post
- [ ] Affiliate link clicks are trackable (UTM parameters or equivalent)

## Blocked by

- #27 — Booking Platform Integration

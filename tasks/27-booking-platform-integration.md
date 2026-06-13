# #27 — Booking Platform Integration (Booking.com / Airbnb)

**Type:** HITL
**Blocked by:** #26 — Verified Stay Review Authenticity

## What to build

Integrate external booking platforms (e.g., Booking.com and Airbnb) so booking data can be imported and linked to RealBnB users and listings. The integration should enable verification flows based on real reservation records and provide a reliable sync mechanism for booking status updates.

## Acceptance criteria

- [ ] Users can connect at least one supported booking platform account (Booking.com or Airbnb) through a secure authorization flow
- [ ] Imported reservation records are mapped to the correct RealBnB user and listing using deterministic matching rules
- [ ] Each imported reservation stores external platform metadata (platform name, external reservation ID, status, check-in/check-out dates, and last sync timestamp)
- [ ] The system de-duplicates reservations across sync runs using a stable idempotency key (platform + external reservation ID)
- [ ] Reservation status updates from the external platform (e.g., confirmed, canceled, completed) are reflected in RealBnB after sync
- [ ] Failed sync operations are logged with actionable error details and can be retried safely
- [ ] A user can disconnect an external platform account, which stops future syncs without deleting existing historical booking evidence
- [ ] Platform credentials/tokens are stored securely and are never exposed to the client

## Blocked by

- #26 — Verified Stay Review Authenticity

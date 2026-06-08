# #4 — HITL: Design Review — Auth & Onboarding Flow

**Type:** HITL
**Blocked by:** #2, #3

## What to build

Design review checkpoint. Review and approve the login page, signup page, and profile setup screen before any further UI is built on top of the authentication layer.

Aspects to evaluate:

- **Login / Signup pages:** layout, provider button hierarchy (Google vs email/password), error states (wrong password, email already taken), link between login and signup
- **Profile setup screen:** field order and grouping, avatar upload/preview interaction, pre-fill behavior for Google users, validation feedback
- **Onboarding prompt:** placement on the Explore feed, copy, and dismiss behavior
- **Transitions:** routing flow from signup → profile setup → Explore; no dead ends or confusing back-navigation

## Acceptance criteria

- [x] Login and signup pages reviewed and approved (or change requests issued)
- [x] Profile setup screen reviewed and approved (or change requests issued)
- [x] Onboarding prompt copy and placement approved
- [x] Any design change requests from this review are resolved before #6 (Post Creation) is started

## Design review outcomes

- Added a Google-first provider hierarchy to signup so login/signup follow the same provider precedence and interaction model.
- Kept explicit credential error surfaces intact for wrong-password and duplicate-email states.
- Improved profile setup with a live avatar preview, fallback initial, and clearer invalid-avatar feedback.
- Added a dismiss action for the onboarding prompt so first-visit guidance is helpful without becoming sticky friction.
- Verified the transition path remains consistent: signup/login -> profile setup (if incomplete) -> explore with onboarding prompt.

## Blocked by

- #2 — Auth: Sign-in (Google OAuth + Email/Password)
- #3 — Auth: Profile Setup & Username Generation

# #2 — Auth: Sign-in (Google OAuth + Email/Password)

**Type:** AFK
**Blocked by:** #1 — Project Foundation & Full Schema

## What to build

Implement the complete sign-in and sign-out flow using NextAuth.js v5 with two providers: Google OAuth and email/password (Credentials). Both flows must create a User record on first sign-in. The session must be available in Server Components, Server Actions, and API Route Handlers. Protected routes must redirect unauthenticated visitors to `/login`.

## Acceptance criteria

- [x] `/login` page renders sign-in options for both Google OAuth and email/password
- [x] `/signup` page renders a registration form for email/password sign-up
- [x] Google OAuth sign-in completes the full redirect flow and creates a User record on first login
- [x] Email/password sign-up creates a User record with a hashed password
- [x] Email/password sign-in authenticates against the stored hashed credential
- [x] Sign-out destroys the session and redirects to `/explore`
- [x] Session (user id, role) is accessible in Server Components and Server Actions via the NextAuth session helper
- [x] Attempting to access a protected route (e.g. `/create`) while unauthenticated redirects to `/login`
- [x] Passwords are stored as bcrypt hashes — never plaintext

## Blocked by

- #1 — Project Foundation & Full Schema

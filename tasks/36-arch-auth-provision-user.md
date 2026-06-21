# #36 — Consolidate user provisioning and eliminate per-request DB reads in auth

**Type:** AFK
**Blocked by:** None

## What to build

Two related problems in `src/auth.ts`:

**1. DB read on every JWT refresh**
The `jwt()` callback issues a `db.user.findUnique` on every request that needs a session to re-stamp `token.sub`, `token.role`, and `token.displayName`. For a read-heavy app this is one DB query per server component render and per server action call. The admin override (`dbUser.email === BASELINE_ADMIN_EMAIL`) also still requires the DB lookup.

**2. User creation in two diverging code paths**
Google sign-in creates a user record (with `generateUniqueUsername`) inside the `signIn` callback in `auth.ts`. Credential sign-up creates a user record in `src/lib/auth-actions.ts`. These are two implementations of the same domain operation — they can silently diverge (e.g. one starts setting a new required field, the other doesn't).

Fix both:

**a. Create `src/lib/user-provisioning.ts`** that exports:
```ts
provisionUser(provider: 'google' | 'credentials', profile: ProvisionProfile): Promise<User>
```
This is the single place responsible for: find-or-create the user, generate a unique username (if new), set `role` from the admin email check, return the full user record. Both `auth.ts` (Google) and `auth-actions.ts` (credentials) call it.

**b. Embed `role` and `isBanned` in the JWT token at sign-in time**, not on every refresh:
```ts
// In jwt() — only on initial sign-in (token.sub is undefined):
if (!token.sub) {
  const user = await provisionUser(...);
  token.sub = user.id;
  token.role = user.role;
  token.isBanned = user.isBanned;
}
// Subsequent refreshes: no DB call
```

When role or ban status changes (admin action), the next sign-in picks up the new values. For immediate enforcement, the admin action that bans a user or changes their role should also call `signOut` for that user's sessions (or accept a short propagation delay — document the decision).

**c. Also fix `generateUniqueUsername`** in `src/lib/usernames.ts`: replace the sequential 25-trip waterfall (`findUnique` per candidate) with a single `findMany({ where: { username: { in: candidates } } })` to check all candidates in one round-trip.

## Acceptance criteria

- [ ] `src/lib/user-provisioning.ts` exports `provisionUser(provider, profile)`
- [ ] Both Google (`auth.ts`) and credentials (`auth-actions.ts`) flows call `provisionUser`
- [ ] No duplicate user-creation logic remains in `auth.ts`
- [ ] `jwt()` callback only issues a DB call on the first token creation (`!token.sub`), not on subsequent refreshes
- [ ] `token.role` and `token.isBanned` are set at sign-in time and read from the token on subsequent requests
- [ ] `generateUniqueUsername` uses a single batched `findMany` instead of up to 25 sequential `findUnique` calls
- [ ] All existing Playwright auth tests continue to pass

## Blocked by

None

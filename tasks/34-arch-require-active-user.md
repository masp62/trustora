# #34 — Centralise ban enforcement with requireActiveUser

**Type:** AFK
**Blocked by:** None

## What to build

The `isBanned` check is performed in only 2 of the 7 write actions (`createExperiencePost` and `addPostComment`). The following write actions currently have **no** ban check:

- `updateExperiencePost`
- `deleteExperiencePost`
- `setPostLikeStatus`
- `setFollowStatus`
- `updateProfile`

Any new write action added to the codebase will silently miss the check — the shallow per-action pattern guarantees this.

Create a `requireActiveUser(session)` helper in `src/lib/auth-guards.ts`:

```ts
export async function requireActiveUser(session: Session | null): Promise<
  { user: ActiveUser } | { error: string }
>
```

The function:
1. Returns `{ error: "Not authenticated" }` if session is null
2. Looks up `isBanned` from the DB (or reads from the JWT token if #36 is done first — see note below)
3. Returns `{ error: "Your account has been suspended." }` if banned
4. Returns `{ user: session.user }` otherwise

Replace the inline auth + isBanned checks in `createExperiencePost` and `addPostComment` with `requireActiveUser`, and add the call to the 5 actions that currently have no check.

**Note:** If #36 (JWT isBanned embedding) is completed first, `requireActiveUser` can read `isBanned` directly from the token and skip the DB lookup entirely.

## Acceptance criteria

- [ ] `src/lib/auth-guards.ts` exports `requireActiveUser(session)`
- [ ] All 7 write actions call `requireActiveUser` as their first guard
- [ ] No inline `isBanned` DB lookup remains in individual action files
- [ ] Banned users cannot create, update, delete posts; like; follow; or update their profile
- [ ] All existing Playwright auth and post tests continue to pass

## Blocked by

None

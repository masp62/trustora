# #4b — User Menu

**Type:** AFK
**Blocked by:** #4a

## What to build

Add an auth-aware user menu to the right side of the site header. The menu adapts its items based on whether the user is logged in or not. It also includes a help link that is always visible.

### Logged-out state

- **Sign in** — links to `/login`
- **Create account** — links to `/signup`
- **Help** — links to a help/FAQ anchor or page

### Logged-in state

- **Edit profile** — links to `/profile/setup`
- **Help** — links to a help/FAQ anchor or page
- **Sign out** — triggers the existing `signOutFromApp` server action

The menu should be a dropdown or popover on smaller screens and can be inline items on larger screens, consistent with common header UX patterns.

## Acceptance criteria

- [ ] The header shows "Sign in" and "Create account" links when the user is not authenticated
- [ ] The header shows "Edit profile" and "Sign out" actions when the user is authenticated
- [ ] A "Help" link is always visible in the menu regardless of auth state
- [ ] On mobile, the menu items are accessible via a hamburger or avatar-based dropdown toggle
- [ ] Sign out uses the existing `signOutFromApp` action and redirects to `/explore`
- [ ] The per-page sign-in/sign-out buttons on `/explore` and `/create` can be removed once the header menu is in place
- [ ] The menu is keyboard-accessible (Tab, Enter, Escape to close)

## Blocked by

- #4a — Site Header & Logo

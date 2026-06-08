# #12 — Follow / Unfollow

**Type:** AFK
**Blocked by:** #3 — Auth: Profile Setup & Username Generation

## What to build

Implement the social follow graph. Logged-in users can follow and unfollow other users from both profile pages and post detail pages. Follower and following counts are visible on profiles. Users can browse their own follower and following lists.

## Acceptance criteria

- [ ] A logged-in user can follow another user from that user's profile page
- [ ] A logged-in user can follow a post's author directly from the post detail page
- [ ] A logged-in user can unfollow a user they already follow (button toggles in place)
- [ ] Follower count and following count are visible on every user profile page
- [ ] A logged-in user can view a list of who they follow at `/u/[username]/following`
- [ ] A logged-in user can view a list of who follows them at `/u/[username]/followers`
- [ ] Self-follow is prevented server-side (a user cannot follow themselves)
- [ ] Duplicate follows are prevented by the composite unique constraint (followerId, followingId)
- [ ] Guests see follower/following counts but cannot follow (follow button not shown or shows login prompt)

## Blocked by

- #3 — Auth: Profile Setup & Username Generation

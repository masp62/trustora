# #1 — Project Foundation & Full Schema

**Type:** HITL
**Blocked by:** None — can start immediately

## What to build

Scaffold the complete project and define the full database schema so every subsequent slice has a stable foundation to build on. This covers the Next.js application skeleton, the entire Prisma schema (all entities and relationships), the Neon PostgreSQL connection, Vercel CI deployment, and the shadcn/ui theme baseline.

The schema must cover all entities from the PRD in a single migration: User, ExperiencePost, PostImage, PostTag, Tag, Like, Comment, Follow, and Report — with all constraints, enums, and foreign keys in place. A seed script must populate the predefined Tag set.

## Acceptance criteria

- [ ] Next.js App Router project initialised with TypeScript
- [ ] Tailwind CSS and shadcn/ui configured with the warm travel-themed color palette
- [ ] Prisma schema defines all entities: User, ExperiencePost, PostImage, PostTag, Tag, Like, Comment, Follow, Report
- [ ] All enums present: `TripType` (solo, couple, family, friends, business), `UserRole` (user, admin), `ReportTargetType` (post, comment), `ReportStatus` (pending, resolved, dismissed)
- [ ] Composite unique constraints in place: Like(userId, postId), Follow(followerId, followingId)
- [ ] Cascading deletes configured (deleting a User removes their posts, comments, likes, follows)
- [ ] Initial migration runs cleanly against a Neon PostgreSQL database
- [ ] Seed script populates the 8 predefined Tags: beach, city-break, countryside, luxury, budget, pet-friendly, unique-stay, remote-work
- [ ] Vercel project connected; pushes to main branch trigger a deploy
- [ ] `.env.example` documents all required environment variables (database URL, auth secrets, Cloudinary, etc.)
- [ ] The deployed app returns a 200 on the index route (placeholder page is fine)

## Blocked by

None — can start immediately

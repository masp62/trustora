# Trustora â€” Product Requirements Document

## Problem Statement

Travelers who book stays through platforms like Airbnb have no dedicated space to share the full story of their experience. Existing options are fragmented and shallow:

- **Airbnb's own reviews** are limited to star ratings and short text, buried inside property listings. There is no social dimension â€” you can't follow a reviewer, browse their other stays, or discover destinations through their eyes.
- **Social media (Instagram, TikTok)** is noisy and not purpose-built for travel stays. Posts disappear into general feeds, aren't searchable by destination or trip type, and lack structured travel metadata.
- **Travel blogs** require significant effort to maintain, are isolated from each other, and offer no community interaction.

The result: valuable first-hand travel knowledge is either locked inside five-star ratings, scattered across general-purpose platforms, or never shared at all.

## Solution

**Trustora** is a social media platform where travelers share rich, visual Experience Posts about their stays. It combines the structured discoverability of a travel platform with the social engagement of a modern feed-based app.

Users create Experience Posts â€” photo-rich narratives that include where they stayed, what it was like, and what they recommend â€” and discover others' experiences by location, tags, and trip type. They follow travelers whose taste they trust, like and comment on posts, and browse auto-generated destination pages.

The platform is:

- **Public by default** â€” anyone can browse and search without an account, making content discoverable via search engines.
- **Visual-first** â€” at least one photo is required per post; the feed is a photography-forward card grid.
- **Standalone** â€” no dependency on Airbnb's API. Users manually share their experiences, and the platform can expand to cover any booking provider.
- **Web-first** â€” responsive design for mobile browsers; native apps deferred to post-traction.

## User Stories

### Authentication & Onboarding

1. As a visitor, I want to sign up with my Google account, so that I can start using the platform with minimal friction.
2. As a visitor, I want to sign up with email and password, so that I have an alternative if I don't want to use Google OAuth.
3. As a new user, I want to be taken to a profile setup screen after signing up, so that I can set my display name, avatar, bio, and location.
4. As a new user, I want my display name pre-filled from my Google profile, so that I don't have to re-type it.
5. As a new user, I want my avatar pre-filled from my Google profile photo, so that I have a profile image immediately.
6. As a new user, I want a username auto-generated from my display name, so that I don't have to think of one during onboarding.
7. As a new user whose auto-generated username is already taken, I want a short random suffix appended (e.g. `markus-42`), so that I still get a username without manual intervention.
8. As a user, I want to change my auto-generated username later from my profile settings, so that I can personalize it when I'm ready.
9. As a new user, I want to be redirected to the Explore feed after profile setup, so that I can immediately discover content.
10. As a new user, I want to see an onboarding prompt suggesting I follow travelers or share my first experience, so that I know what to do next.
11. As a user, I want to log in with Google or email/password, so that I can access my account.
12. As a user, I want to log out, so that I can end my session.

### Experience Posts â€” Creating

13. As a logged-in user, I want to create an Experience Post with a title (max 120 characters), so that I can headline my story.
14. As a logged-in user, I want to write a rich-text body (max ~5000 characters) for my post, so that I can tell the full story of my stay.
15. As a logged-in user, I want to upload between 1 and 10 photos to my post, so that I can visually showcase my experience.
16. As a logged-in user, I want my uploaded photos to be automatically checked for NSFW content and rejected if flagged, so that the platform stays safe.
17. As a logged-in user, I want to specify the location (city + country) of the property as a required field, so that my post is discoverable by destination.
18. As a logged-in user, I want to optionally add a property name, so that others can identify the specific listing if I choose to share it.
19. As a logged-in user, I want to select up to 5 tags from a predefined list (e.g. beach, city-break, countryside, luxury, budget, pet-friendly, unique-stay, remote-work), so that my post is discoverable by category.
20. As a logged-in user, I want to select a trip type (solo, couple, family, friends, business), so that others can filter by travel style.
21. As a logged-in user, I want to be prevented from creating more than 5 posts per day, so that spam is discouraged.
22. As a logged-in user, I want to see a clear validation message if I try to submit a post without a title, body, at least one photo, or a location, so that I know what's missing.

### Experience Posts â€” Viewing

23. As any visitor (logged in or not), I want to view the full detail page of an Experience Post, so that I can read the story and see all photos.
24. As a visitor, I want to see the post's photo gallery, title, body, location, tags, trip type, author info, like count, and comments on the detail page, so that I get the complete picture.
25. As a visitor, I want to browse through the photo gallery on a post, so that I can see all uploaded images.
26. As a visitor, I want to see the author's avatar, display name, and username on each post, so that I know who wrote it.
27. As a visitor, I want to click the author's name to visit their profile, so that I can see their other experiences.
28. As a visitor, I want the post detail page to have a SEO-friendly URL with ID and slug (`/post/[id]/[slug]`), so that the page ranks well in search engines and is shareable.
29. As a visitor, I want to be redirected to the correct slug URL if I visit a post with an incorrect or outdated slug, so that links always resolve properly.

### Experience Posts â€” Editing & Deleting

30. As a post author, I want to edit my own Experience Post (title, body, photos, location, tags, trip type, property name), so that I can fix mistakes or add details.
31. As a post author, I want to delete my own Experience Post, so that I can remove content I no longer want public.
32. As a post author, I want a confirmation dialog before deletion, so that I don't accidentally remove a post.

### Social Interactions â€” Likes

33. As a logged-in user, I want to like an Experience Post, so that I can show appreciation.
34. As a logged-in user, I want to unlike a previously liked post, so that I can change my mind.
35. As a visitor, I want to see the total like count on each post, so that I can gauge its popularity.
36. As a visitor who tries to like a post without being logged in, I want to be prompted to log in, so that I understand why the action failed.

### Social Interactions â€” Comments

37. As a logged-in user, I want to comment on an Experience Post, so that I can engage in conversation or ask questions.
38. As a logged-in user, I want to delete my own comment, so that I can remove something I regret posting.
39. As a visitor, I want to read all comments on a post in chronological order, so that I can follow the discussion.
40. As a visitor who tries to comment without being logged in, I want to be prompted to log in, so that I understand why the action failed.

### Social Interactions â€” Following

41. As a logged-in user, I want to follow another user from their profile or from a post, so that their future posts appear in my home feed.
42. As a logged-in user, I want to unfollow a user, so that I can stop seeing their posts in my feed.
43. As a visitor, I want to see a user's follower count and following count on their profile, so that I can gauge their presence.
44. As a logged-in user, I want to see a list of who I'm following and who follows me, so that I can manage my social connections.

### User Profiles

45. As a visitor, I want to view any user's public profile page at `/u/[username]`, so that I can see their bio, avatar, location, and all their Experience Posts.
46. As a visitor, I want to see a user's post count on their profile, so that I know how active they are.
47. As a logged-in user, I want to edit my profile (display name, avatar, bio, location, username), so that I can keep my information current.
48. As a logged-in user, I want to upload a new avatar from my device, so that I can personalize my profile.
49. As a user changing my username, I want to be informed if the new username is already taken, so that I can choose another.

### Feed â€” Home (Following)

50. As a logged-in user, I want a home feed showing posts from users I follow in reverse chronological order, so that I see the latest content from people I care about.
51. As a logged-in user who follows nobody, I want to see a prompt to discover users or browse the Explore feed, so that my home feed is never a dead end.
52. As a logged-in user, I want infinite scroll on the home feed, so that I can keep browsing without clicking pagination.

### Feed â€” Explore (Discover)

53. As any visitor, I want to browse an Explore feed showing posts from all users sorted by recency and engagement, so that I can discover interesting experiences.
54. As a visitor, I want to filter the Explore feed by location (country, city), so that I can find experiences at a specific destination.
55. As a visitor, I want to filter the Explore feed by tag, so that I can find a specific type of stay (e.g. beach, luxury).
56. As a visitor, I want to filter the Explore feed by trip type (solo, couple, family, friends, business), so that I can find experiences relevant to my travel style.
57. As a visitor, I want to combine multiple filters (e.g. "beach" + "Portugal" + "couple"), so that I can narrow results precisely.
58. As a visitor, I want infinite scroll on the Explore feed, so that I can keep browsing seamlessly.

### Discovery â€” Location Pages

59. As a visitor, I want to browse a location page (e.g. `/explore/portugal/lisbon`) showing all Experience Posts for that city, so that I can research a destination.
60. As a visitor, I want location pages to be auto-generated when at least one post exists for a city, so that every mentioned destination is browsable.
61. As a visitor, I want to browse a country-level page (e.g. `/explore/portugal`) showing all posts for that country, so that I can explore broadly.
62. As a search engine crawler, I want location pages to have proper meta tags (title, description, Open Graph), so that they rank and preview well.

### Discovery â€” Tag Pages

63. As a visitor, I want to browse a tag page (e.g. `/explore/tags/beach`) showing all posts with that tag, so that I can discover stays by category.
64. As a visitor, I want tag pages to be auto-generated from the predefined tag list, so that discovery is consistent.

### Search

65. As a visitor, I want to search for Experience Posts using free-text keywords, so that I can find specific content.
66. As a visitor, I want search to match against post titles, body text, and locations, so that results are comprehensive.
67. As a visitor, I want to see search results on a dedicated page (`/search?q=...`), so that I can browse and refine.
68. As a visitor, I want search results to show the same post card format as the feed, so that the experience is consistent.

### Content Moderation

69. As a logged-in user, I want to report an Experience Post as inappropriate, so that I can flag harmful content for review.
70. As a logged-in user, I want to report a comment as inappropriate, so that I can flag abusive comments.
71. As an admin, I want to view a dashboard listing all reported content, so that I can review flagged items.
72. As an admin, I want to remove a reported post, so that I can enforce community standards.
73. As an admin, I want to remove a reported comment, so that I can clean up abuse.
74. As an admin, I want to ban a user, so that repeat offenders cannot continue posting.
75. As an admin, I want to dismiss a report as unfounded, so that I can clear the queue without taking action.
76. As an admin, I want the admin dashboard accessible only to my account at `/admin`, so that regular users cannot access moderation tools.

### Responsive Design

77. As a mobile user, I want the feed to display as a single-column scrollable list of cards, so that it's comfortable on small screens.
78. As a desktop user, I want the feed to display as a multi-column card grid (2â€“3 columns), so that I can see more content at once.
79. As a mobile user, I want all forms (create post, edit profile, login) to be fully usable on a small screen, so that I can do everything from my phone.

### SEO & Public Access

80. As a visitor who is not logged in, I want to read posts, browse feeds, view profiles, search, and browse location/tag pages without creating an account, so that the platform is open and discoverable.
81. As a search engine crawler, I want all public pages to be server-rendered with proper meta tags, so that content is indexed and ranks well.
82. As a visitor arriving from a search engine, I want to land on a fully rendered page (not a loading spinner), so that I can immediately see content.

## Implementation Decisions

### Architecture

- **Monolithic full-stack application** using Next.js App Router. No separate backend service. All server logic lives in Server Actions and API Route Handlers within the Next.js app.
- **Web-first, mobile-responsive.** No native mobile app in scope. The UI must be fully functional on mobile browsers.

### Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui component library (copy-paste, fully owned components)
- **Database:** PostgreSQL hosted on Neon (serverless, scales to zero)
- **ORM:** Prisma (type-safe queries, migration management)
- **Authentication:** NextAuth.js v5 (Auth.js) â€” Google OAuth + Credentials provider (email/password)
- **Image Storage:** Cloudinary (upload, transformation, CDN delivery, NSFW moderation on upload)
- **Hosting:** Vercel

### Data Model (Entities & Relationships)

- **User** â€” `id`, `email`, `username` (unique, auto-generated from display name with random suffix if collision), `displayName`, `avatarUrl`, `bio` (max 280 chars), `location`, `role` (user | admin), `createdAt`
- **ExperiencePost** â€” `id`, `slug` (generated from title), `title` (max 120 chars), `body` (max ~5000 chars), `locationCity`, `locationCountry`, `propertyName` (optional), `tripType` (enum: solo, couple, family, friends, business), `authorId` (FK â†’ User), `createdAt`, `updatedAt`
- **PostImage** â€” `id`, `postId` (FK â†’ ExperiencePost), `cloudinaryUrl`, `order` (for gallery sequencing)
- **PostTag** â€” join table: `postId` (FK) â†” `tagId` (FK). Max 5 tags per post enforced at application layer.
- **Tag** â€” `id`, `name` (unique). Predefined seed set: beach, city-break, countryside, luxury, budget, pet-friendly, unique-stay, remote-work.
- **Like** â€” `userId` + `postId` (composite unique). No duplicate likes.
- **Comment** â€” `id`, `body`, `postId` (FK), `authorId` (FK â†’ User), `createdAt`
- **Follow** â€” `followerId` + `followingId` (composite unique). Self-follow prevented at application layer.
- **Report** â€” `id`, `reporterId` (FK â†’ User), `targetType` (post | comment), `targetId`, `reason` (optional text), `status` (pending | resolved | dismissed), `createdAt`

### Key Relationships

- User 1 â†’ N ExperiencePost (author)
- ExperiencePost 1 â†’ N PostImage (1â€“10, enforced at app layer)
- ExperiencePost N â†” N Tag (via PostTag, max 5 per post)
- User N â†” N ExperiencePost (via Like)
- User 1 â†’ N Comment
- ExperiencePost 1 â†’ N Comment
- User N â†” N User (via Follow â€” follower/following)

### Feed Logic

- **Home feed:** `SELECT posts WHERE author_id IN (users I follow) ORDER BY created_at DESC`, paginated with cursor-based pagination.
- **Explore feed:** `SELECT posts ORDER BY created_at DESC` with optional filters on `locationCountry`, `locationCity`, `tripType`, and tags. Engagement-weighted sorting (likes + comments) as a secondary signal.
- Both feeds use **infinite scroll** with cursor-based pagination.

### URL Routing

| Route Pattern | Description |
|---|---|
| `/` | Home feed (following) â€” redirects to `/explore` if not logged in |
| `/explore` | Discover feed |
| `/explore/[country]/[city]` | Auto-generated location page |
| `/explore/[country]` | Country-level location page |
| `/explore/tags/[tag]` | Tag page |
| `/post/[id]/[slug]` | Experience Post detail (redirects to correct slug if wrong) |
| `/create` | Create new post (protected) |
| `/u/[username]` | User profile |
| `/u/[username]/edit` | Edit profile (protected, own profile only) |
| `/search?q=` | Search results |
| `/login` | Login |
| `/signup` | Signup |
| `/admin` | Admin dashboard (protected, admin only) |

### Username Generation

- Derive from display name: lowercase, strip non-alphanumeric (except hyphens), collapse whitespace to hyphens.
- On collision, append `-` + random 2-digit number. Retry on further collision.
- Users can change their username later from profile settings. Uniqueness enforced at database level.

### Image Upload

- Uploads go to Cloudinary via their upload widget or server-side SDK.
- NSFW moderation enabled on upload â€” images flagged as NSFW are rejected before being attached to a post.
- Images are served via Cloudinary CDN with on-the-fly transformations (responsive sizing, format optimization).
- Minimum 1 photo, maximum 10 photos per post. Enforced at form validation and server-side.

### Rate Limiting

- Maximum 5 Experience Post creations per user per 24-hour rolling window.
- Enforced server-side by counting recent posts per user before insert.

### Access Control

- **Public (no auth):** Read posts, profiles, feeds, location pages, tag pages, search.
- **Authenticated:** Create/edit/delete own posts, like, comment, follow, report, edit own profile.
- **Admin:** Access `/admin`, review reports, remove content, ban users.

### UI Layout

- **Desktop feed:** 2â€“3 column card grid. Each card: lead photo, title, location, author avatar + name, like count.
- **Mobile feed:** Single-column stack of cards.
- **Post detail:** Full-width photo gallery at top, story body below, metadata (location, tags, trip type) as chips, comments section at bottom.
- **Design language:** Clean, whitespace-heavy, photography-forward. Warm color palette evoking travel/hospitality.

## Testing Decisions

### What Makes a Good Test

Tests should verify **external behavior through public interfaces**, not implementation details. A test should describe what a user or API consumer would observe, not how internal functions are wired. Tests should be resilient to refactoring â€” if you rename an internal helper, no test should break.

### Testing Seams

1. **API Route / Server Action boundary** â€” Integration tests hitting Next.js API routes and Server Actions against a test PostgreSQL database (Neon branch or local Docker PG). Asserts HTTP status codes, response shapes, and resulting database state. Covers: post CRUD, likes, comments, follows, feed assembly, search, reports, admin moderation actions, rate limiting, access control.

2. **Prisma schema + migrations** â€” Schema-level validation ensuring migrations run cleanly, unique constraints hold (username, like composite key, follow composite key), cascading deletes work correctly (deleting a user removes their posts, comments, likes, follows), and enum values are enforced.

3. **React component boundary** â€” Component tests with React Testing Library. Server action / fetch layer is mocked. Covers: post card rendering, form validation (create post, edit profile, login/signup), filter controls, infinite scroll triggering, like/unlike toggle, comment submission, photo gallery navigation, responsive layout breakpoints.

4. **Auth boundary** â€” Integration tests verifying: unauthenticated users can read all public pages; unauthenticated users are prompted to log in when attempting write actions; authenticated users can only edit/delete their own content; admin routes reject non-admin users; OAuth and credentials flows complete successfully.

5. **Image upload boundary** â€” Integration tests against Cloudinary's test/sandbox mode. Validates: accepted file types, file size limits, photo count limits (1â€“10 per post), NSFW detection rejects flagged images, successful upload returns a CDN URL.

### Prior Art

None â€” greenfield project. The first set of tests will establish patterns for all subsequent testing.

## Out of Scope

The following are explicitly excluded from this PRD and deferred to future iterations:

- **Bookmarks / save posts** â€” Tier 2
- **Share button (native sharing)** â€” Tier 2
- **Notifications (likes, comments, new followers)** â€” Tier 2
- **Highlight ratings (1â€“5 scale for cleanliness, location, host, value)** â€” Tier 2
- **Tips section on posts** â€” Tier 2
- **Stay dates on posts** â€” Tier 2
- **Direct messaging between users** â€” Tier 3
- **Collections / curated lists** â€” Tier 3
- **Map-based discovery** â€” Tier 3
- **Mention other users in posts/comments** â€” Tier 3
- **Stories / reels** â€” No plans
- **Groups / communities** â€” No plans
- **Native mobile app (iOS / Android)** â€” Post-traction
- **Airbnb API integration** â€” Not planned
- **Email verification** â€” Deferred until spam becomes a concern
- **Algorithmic "For You" feed** â€” Deferred until sufficient data volume
- **Trending / popular sections** â€” Deferred
- **Community moderators / mod roles** â€” Deferred, admin-only for now
- **AI-powered content moderation** â€” Deferred
- **Appeal process for moderation** â€” Handled manually via email
- **Cover / banner photo on profiles** â€” Low value for MVP
- **Travel stats / maps on profiles** â€” Tier 3
- **Social links on profiles** â€” Low value for MVP
- **Custom tags (user-created)** â€” Only predefined tags for MVP
- **Video uploads** â€” Deferred

## Further Notes

- **Predefined tag list** is seeded into the database at initial migration: `beach`, `city-break`, `countryside`, `luxury`, `budget`, `pet-friendly`, `unique-stay`, `remote-work`. This list may be expanded in future iterations but is fixed for MVP.
- **Slug generation** for post URLs should use a library like `slugify` to produce URL-safe slugs from the title. The `id` in the URL is the primary lookup key; the slug is for SEO and readability only. Visiting a post with a mismatched slug should 301-redirect to the canonical URL.
- **Country/city normalization** will be important for location page generation. Consider using a geocoding service or a controlled location picker (autocomplete from a known dataset) to prevent duplicates like "Lisbon" vs "Lisboa" vs "lisbon". This is a UX/data-quality decision to finalize during implementation.
- **Admin identification** for MVP is a simple role field on the User model. The first admin account is seeded or manually set in the database. No self-service admin registration.
- **Rate limiting** (5 posts/day) is enforced at the Server Action layer by querying the user's post count in the last 24 hours before allowing creation. No external rate-limiting service needed for MVP.


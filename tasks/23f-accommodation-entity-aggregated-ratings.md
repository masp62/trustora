# #23f — Accommodation Entity & Time-Weighted Aggregated Ratings

**Type:** AFK
**Blocked by:** #23c — Accommodation Rating & Review Criteria, #07 — Post Detail Page Slug URL

## What to build

Introduce an **Accommodation** entity as a first-class concept above individual stories (ExperiencePost). An accommodation represents a specific property (e.g. a particular Airbnb listing or hotel) that multiple users can write stories about over time.

Currently, each story exists independently. This task groups stories under a shared accommodation, enabling aggregated ratings, a dedicated accommodation page, and chronological story timelines per property.

### Accommodation model

- An accommodation is identified by a combination of property name + location (city, country), or an explicit link by the author
- One accommodation can have many stories (1:n relationship)
- A story belongs to at most one accommodation (nullable FK — legacy stories without property name remain unlinked)
- The accommodation page shows all linked stories in chronological order (newest first), plus the aggregated rating

Suggested schema additions:

```
model Accommodation {
  id              String   @id @default(cuid())
  name            String   @db.VarChar(140)
  locationCity    String
  locationCountry String
  slug            String   @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  posts           ExperiencePost[]
}
```

On `ExperiencePost`, add:
```
accommodationId String?
accommodation   Accommodation? @relation(fields: [accommodationId], references: [id])
```

### Linking behavior

- When a user creates a story with a property name + location, the system checks if a matching accommodation already exists
- If yes: the story is linked to the existing accommodation
- If no: a new accommodation is created and the story is linked
- Authors can manually unlink or re-link stories to accommodations (edge case for corrections)

### Time-weighted aggregated ratings

Ratings from #23c are aggregated across **all stories** belonging to an accommodation, not per individual story. The aggregation uses a **time-decay weighting** function:

**Weighting rules:**

- Ratings from the last 30 days: weight = 1.0 (full relevance)
- Ratings 1–6 months old: weight = 0.75
- Ratings 6–9 months old: weight = 0.5
- Ratings 9–12 months old: weight = 0.25
- Ratings older than 12 months: weight = 0.0 (excluded from aggregation entirely)

The weighted average is recalculated:
- On each new rating submission
- On a daily scheduled job (to account for aging out of old ratings)

**Aggregated display:**

- The accommodation page shows the time-weighted overall score and category averages
- The number of contributing ratings (within the 12-month window) is displayed
- Individual story detail pages still show per-story ratings, but also link to the accommodation's aggregated score

### Accommodation page

- Accessible via `/accommodation/[slug]`
- Shows: accommodation name, location, aggregated rating (overall + categories), total contributing ratings count
- Lists all linked stories in reverse chronological order (newest first)
- Each story card shows its individual rating, author, date, and thumbnail

### Migration strategy

- Existing stories with a `propertyName` and matching location are auto-grouped into accommodations during migration
- Stories without a `propertyName` remain unlinked
- Deduplication uses case-insensitive matching on `propertyName` + `locationCity` + `locationCountry`

## Acceptance criteria

- [x] An `Accommodation` model exists in the database with name, location, and slug
- [x] `ExperiencePost` has an optional foreign key to `Accommodation`
- [x] Creating a story with a property name + location auto-links it to an existing or new accommodation
- [x] The accommodation page (`/accommodation/[slug]`) shows all linked stories in chronological order (newest first)
- [x] Ratings from #23c are aggregated across all stories of an accommodation using time-weighted averaging
- [x] Ratings older than 12 months are excluded from the aggregated score (weight = 0)
- [x] Ratings from the last 30 days have maximum weight (1.0), decaying through 0.75, 0.5, 0.25 for older brackets
- [x] The accommodation page displays the weighted overall score, category averages, and contributing rating count
- [x] Individual story pages link to their parent accommodation's aggregated rating
- [x] A daily job recalculates aggregated scores to reflect time-decay changes
- [x] A migration script groups existing stories by property name + location into accommodations
- [x] Authors can correct the accommodation link on their own stories
- [x] Stories without a property name remain unlinked and function as before

## Blocked by

- #23c — Accommodation Rating & Review Criteria
- #07 — Post Detail Page Slug URL

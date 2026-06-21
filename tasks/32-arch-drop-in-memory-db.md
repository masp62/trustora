# #32 — Replace the in-memory Prisma emulator with a real test database

**Type:** AFK
**Blocked by:** None

## What to build

`src/lib/db.ts` exports either a real `PrismaClient` or `createInMemoryDb(store)` — a 500-line hand-rolled re-implementation of Prisma's query engine with custom `matchesWhere`, `applySelect`, `sortEntries`, and `paginate` helpers, plus TypeScript types (`InMemoryUser`, `InMemoryExperiencePost`, etc.) that shadow the real schema.

This emulator silently diverges from Postgres: it supports no `OR` clauses, no nested relation queries, and no complex `where` predicates. Code that passes against the emulator can fail against Postgres in production. Every schema change requires updating three places: `prisma/schema.prisma`, the migration, and the in-memory type definitions and data-manipulation logic.

Replace the dev/test adapter with a real Postgres connection:

1. Provide a `DATABASE_URL` pointing at a local Postgres instance (Docker Compose is fine) for development and test environments.
2. In tests, use transaction rollback (wrap each test in a transaction, roll back in `afterEach`) or `prisma migrate reset --skip-seed` per test suite for isolation.
3. Delete `createInMemoryDb`, all `InMemory*` type definitions, and the branch in `db.ts` that selects between adapters.
4. Update `db.ts` to always export a single `PrismaClient` instance.
5. Add a `docker-compose.yml` (or extend an existing one) with a `postgres` service for local development.

## Acceptance criteria

- [ ] `createInMemoryDb` and all `InMemory*` types are deleted from `db.ts`
- [ ] `db.ts` exports a single `PrismaClient` instance in all environments
- [ ] `docker-compose.yml` provides a local Postgres service with the correct `DATABASE_URL`
- [ ] Tests that previously used the in-memory adapter now run against real Postgres
- [ ] `npm run test` (or equivalent) passes with the real database
- [ ] All existing Playwright tests continue to pass

## Blocked by

None

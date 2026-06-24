# Trustora

Trustora is a Next.js App Router application for sharing travel stay experiences.

## Project Foundation Status

- Next.js 16 + TypeScript + App Router configured
- Tailwind v4 and shadcn/ui baseline tokens configured
- Full Prisma schema for the MVP domain implemented
- Prisma seed script for predefined tags and local baseline demo data implemented

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and fill secrets:

```bash
cp .env.example .env
```

3. Create your first migration and generate Prisma client:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

4. Seed baseline local data (tags, 2 users, and stories):

```bash
npm run prisma:seed
```

5. Run the app:

```bash
npm run dev
```

## Baseline Local Accounts

The seed creates two users with profiles and 5-8 stories each.

- Email: `anna@trustora.local` | Password: `12345678`
- Email: `lukas@trustora.local` | Password: `12345678`

Admin account for moderation stories:

- Email: `anna@trustora.local` | Password: `12345678` | Role: `admin`

`npm run dev` automatically runs the seed first, so baseline data is available each time the app starts.

When `USE_IN_MEMORY_DB=true`, Prisma seed is skipped automatically and the app starts without requiring a PostgreSQL connection. In-memory baseline users and stories are loaded directly from the app's in-memory store initializer.

## Prisma Commands

- `npm run prisma:migrate` - run a development migration
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:seed` - seed predefined tags
- `npm run prisma:studio` - open Prisma Studio

## Accommodation Aggregate Recompute Cron

Story 23f introduces time-decayed accommodation aggregates. A daily recompute endpoint is available at:

- `POST /api/cron/accommodation-aggregates`

Security:

- Set `CRON_SECRET` in your environment.
- Send the same value in the `x-cron-token` header.

Example call:

```bash
curl -X POST \
	-H "x-cron-token: $CRON_SECRET" \
	http://localhost:3000/api/cron/accommodation-aggregates
```

Response:

- `200 { "ok": true, "recomputed": <count> }` on success
- `401 { "error": "UNAUTHORIZED" }` if the token is missing or wrong

## Vercel Deployment

Automatic deploys on push to `main` are enabled after linking this repo to Vercel once:

1. Import this Git repository in Vercel.
2. Set all environment variables from `.env.example` in Vercel project settings.
3. Confirm production branch is `main`.

After that, every push to `main` triggers a production deployment.


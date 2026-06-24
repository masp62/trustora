-- Story 23f: accommodation-first model
-- 1) Add Accommodation entity
CREATE TABLE "Accommodation" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(140) NOT NULL,
  "locationCity" TEXT NOT NULL,
  "locationCountry" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "weightedOverallScore" DOUBLE PRECISION,
  "weightedCleanliness" DOUBLE PRECISION,
  "weightedAccuracy" DOUBLE PRECISION,
  "weightedCheckIn" DOUBLE PRECISION,
  "weightedCommunication" DOUBLE PRECISION,
  "weightedLocation" DOUBLE PRECISION,
  "weightedValue" DOUBLE PRECISION,
  "weightedComfort" DOUBLE PRECISION,
  "weightedFacilities" DOUBLE PRECISION,
  "contributingRatingCount" INTEGER NOT NULL DEFAULT 0,
  "aggregateUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Accommodation_slug_key" ON "Accommodation"("slug");
CREATE UNIQUE INDEX "Accommodation_name_locationCity_locationCountry_key" ON "Accommodation"("name", "locationCity", "locationCountry");
CREATE INDEX "Accommodation_locationCountry_locationCity_idx" ON "Accommodation"("locationCountry", "locationCity");

-- 2) Add nullable FK column first for backfill
ALTER TABLE "ExperiencePost"
  ADD COLUMN "accommodationId" TEXT;

-- 3) Build accommodations from posts that have property name
WITH grouped AS (
  SELECT
    MIN("id") AS seed_post_id,
    TRIM("propertyName") AS name,
    "locationCity",
    "locationCountry"
  FROM "ExperiencePost"
  WHERE "propertyName" IS NOT NULL
    AND LENGTH(TRIM("propertyName")) > 0
  GROUP BY LOWER(TRIM("propertyName")), LOWER("locationCity"), LOWER("locationCountry"), TRIM("propertyName"), "locationCity", "locationCountry"
)
INSERT INTO "Accommodation" (
  "id",
  "name",
  "locationCity",
  "locationCountry",
  "slug",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('acc_', SUBSTRING(MD5(seed_post_id) FROM 1 FOR 20)) AS id,
  name,
  "locationCity",
  "locationCountry",
  LEFT(
    CONCAT(
      REGEXP_REPLACE(LOWER(name || '-' || "locationCity" || '-' || "locationCountry"), '[^a-z0-9]+', '-', 'g'),
      '-',
      SUBSTRING(MD5(LOWER(name || '|' || "locationCity" || '|' || "locationCountry")) FROM 1 FOR 6)
    ),
    120
  ) AS slug,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM grouped;

-- 4) Link posts to accommodations
UPDATE "ExperiencePost" p
SET "accommodationId" = a."id"
FROM "Accommodation" a
WHERE p."propertyName" IS NOT NULL
  AND LENGTH(TRIM(p."propertyName")) > 0
  AND LOWER(TRIM(p."propertyName")) = LOWER(a."name")
  AND LOWER(p."locationCity") = LOWER(a."locationCity")
  AND LOWER(p."locationCountry") = LOWER(a."locationCountry");

-- 5) Delete orphan experience posts without accommodation link (product decision)
DELETE FROM "ExperiencePost"
WHERE "accommodationId" IS NULL;

-- 6) Comments are migrated to accommodation scope by reset (product decision)
DELETE FROM "Comment";

-- 7) Enforce required accommodation FK on experience posts
ALTER TABLE "ExperiencePost"
  ALTER COLUMN "accommodationId" SET NOT NULL;

ALTER TABLE "ExperiencePost"
  ADD CONSTRAINT "ExperiencePost_accommodationId_fkey"
  FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ExperiencePost_accommodationId_createdAt_idx" ON "ExperiencePost"("accommodationId", "createdAt" DESC);

-- 8) Move comments from post-level to accommodation-level
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_postId_fkey";
ALTER TABLE "Comment" DROP COLUMN "postId";
ALTER TABLE "Comment" ADD COLUMN "accommodationId" TEXT NOT NULL;
ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_accommodationId_fkey"
  FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Comment_accommodationId_createdAt_idx" ON "Comment"("accommodationId", "createdAt");

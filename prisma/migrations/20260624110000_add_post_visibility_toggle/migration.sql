-- Create enum for post visibility
CREATE TYPE "PostVisibility" AS ENUM ('public', 'private');

-- Add visibility fields to experience posts
ALTER TABLE "ExperiencePost"
  ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'public',
  ADD COLUMN "visibilityChangedAt" TIMESTAMP(3);

-- Explicitly backfill existing stories as public
UPDATE "ExperiencePost"
SET "visibility" = 'public'
WHERE "visibility" IS NULL;

-- Support status + visibility feed filtering
CREATE INDEX "ExperiencePost_status_visibility_createdAt_idx"
  ON "ExperiencePost"("status", "visibility", "createdAt" DESC);

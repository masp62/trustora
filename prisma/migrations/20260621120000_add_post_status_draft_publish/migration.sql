-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "ExperiencePost"
ADD COLUMN "status" "PostStatus" NOT NULL DEFAULT 'published',
ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Backfill publishedAt for historical published rows
UPDATE "ExperiencePost"
SET "publishedAt" = "createdAt"
WHERE "status" = 'published' AND "publishedAt" IS NULL;

-- CreateIndex
CREATE INDEX "ExperiencePost_status_createdAt_idx" ON "ExperiencePost"("status", "createdAt" DESC);

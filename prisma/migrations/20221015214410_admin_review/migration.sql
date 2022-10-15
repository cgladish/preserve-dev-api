-- DropIndex
DROP INDEX "Snippet_createdAt_idx";

-- AlterTable
ALTER TABLE "Snippet" ADD COLUMN     "adminApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminReviewed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Snippet_creatorId_public_nsfw_adminReviewed_adminApproved_c_idx" ON "Snippet"("creatorId", "public", "nsfw", "adminReviewed", "adminApproved", "createdAt");

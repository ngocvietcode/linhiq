-- Make email optional + add username for kids who don't have email
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");

-- ParentLinkRequest: email-or-username target
ALTER TABLE "ParentLinkRequest" RENAME COLUMN "childEmail" TO "childIdentifier";
ALTER INDEX "ParentLinkRequest_childEmail_status_idx" RENAME TO "ParentLinkRequest_childIdentifier_status_idx";

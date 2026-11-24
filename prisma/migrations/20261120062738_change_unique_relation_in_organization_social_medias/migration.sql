/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,platform,username]` on the table `organization_social_medias` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "organization_social_medias_organization_id_idx";

-- DropIndex
DROP INDEX "organization_social_medias_organization_id_platform_key";

-- DropIndex
DROP INDEX IF EXISTS "organization_social_medias_platform_username_key";

-- DropIndex
DROP INDEX IF EXISTS "organization_social_medias_username_key";

-- CreateIndex
CREATE UNIQUE INDEX "organization_social_medias_organization_id_platform_usernam_key" ON "organization_social_medias"("organization_id", "platform", "username");

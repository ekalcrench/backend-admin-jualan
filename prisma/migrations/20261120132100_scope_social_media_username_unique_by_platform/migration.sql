-- Drop the global username constraint and enforce uniqueness per platform.
DROP INDEX "organization_social_medias_username_key";

CREATE UNIQUE INDEX "organization_social_medias_platform_username_key"
ON "organization_social_medias"("platform", "username");

-- The organization-scoped unique index is created by the preceding migration.
-- Remove legacy global and platform-only constraints if present.
DROP INDEX IF EXISTS "organization_social_medias_username_key";
DROP INDEX IF EXISTS "organization_social_medias_platform_username_key";

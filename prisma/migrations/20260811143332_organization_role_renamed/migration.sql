/*
  Warnings:

  - Changed the type of `role` on the `organization_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "organization_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "organization_users" DROP COLUMN "role",
ADD COLUMN     "role" "organization_role" NOT NULL;

-- DropEnum
DROP TYPE "OrganizationRole";

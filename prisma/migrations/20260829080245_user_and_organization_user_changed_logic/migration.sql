/*
  Warnings:

  - The values [PENDING_APPROVAL,REJECTED] on the enum `user_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `approved_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by_id` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "organization_user_status" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "user_status_new" AS ENUM ('PENDING_EMAIL', 'ACTIVE', 'SUSPENDED');
ALTER TABLE "public"."users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "user_status_new" USING ("status"::text::"user_status_new");
ALTER TYPE "user_status" RENAME TO "user_status_old";
ALTER TYPE "user_status_new" RENAME TO "user_status";
DROP TYPE "public"."user_status_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING_EMAIL';
COMMIT;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_approved_by_id_fkey";

-- AlterTable
ALTER TABLE "organization_users" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" UUID,
ADD COLUMN     "status" "organization_user_status" NOT NULL DEFAULT 'PENDING_APPROVAL',
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "approved_at",
DROP COLUMN "approved_by_id",
ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'USER';

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

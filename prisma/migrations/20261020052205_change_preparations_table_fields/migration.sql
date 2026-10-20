/*
  Warnings:

  - Made the column `name` on table `preparations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "preparations" ADD COLUMN     "expired_at" TIMESTAMP(3),
ALTER COLUMN "name" SET NOT NULL;

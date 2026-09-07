/*
  Warnings:

  - Made the column `address` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `organizations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "address" SET DEFAULT '',
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" SET DEFAULT '',
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "phone" SET DEFAULT '';

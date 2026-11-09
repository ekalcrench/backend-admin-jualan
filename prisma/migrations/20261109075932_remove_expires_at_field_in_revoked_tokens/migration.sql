/*
  Warnings:

  - You are about to drop the column `expires_at` on the `revoked_tokens` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "revoked_tokens_expires_at_idx";

-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_lot_id" SET DEFAULT '4cf5dd49-eb63-4a51-b577-e7b2a08923f0';

-- AlterTable
ALTER TABLE "revoked_tokens" DROP COLUMN "expires_at";

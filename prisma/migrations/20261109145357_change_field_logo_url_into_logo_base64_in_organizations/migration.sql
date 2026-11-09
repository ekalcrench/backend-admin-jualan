/*
  Warnings:

  - You are about to drop the column `logo_url` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_lot_id" SET DEFAULT '4cf5dd49-eb63-4a51-b577-e7b2a08923f0';

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "logo_url",
ADD COLUMN     "logo_base64" TEXT DEFAULT '';

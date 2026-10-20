/*
  Warnings:

  - You are about to drop the column `inventoryLotId` on the `preparation_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "preparation_items" DROP CONSTRAINT "preparation_items_inventoryLotId_fkey";

-- AlterTable
ALTER TABLE "preparation_items" DROP COLUMN "inventoryLotId";

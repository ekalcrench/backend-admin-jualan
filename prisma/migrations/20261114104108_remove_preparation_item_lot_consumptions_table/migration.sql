/*
  Warnings:

  - You are about to drop the `preparation_item_lot_consumptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "preparation_item_lot_consumptions" DROP CONSTRAINT "preparation_item_lot_consumptions_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "preparation_item_lot_consumptions" DROP CONSTRAINT "preparation_item_lot_consumptions_preparation_item_id_fkey";

-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_lot_id" SET DEFAULT '4cf5dd49-eb63-4a51-b577-e7b2a08923f0';

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "reference_id" DROP DEFAULT;

-- DropTable
DROP TABLE "preparation_item_lot_consumptions";

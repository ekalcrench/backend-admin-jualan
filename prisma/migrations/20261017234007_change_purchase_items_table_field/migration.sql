/*
  Warnings:

  - You are about to alter the column `quantity` on the `purchase_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Integer`.
  - Added the required column `package_size` to the `purchase_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
-- DROP INDEX "preparation_item_lot_consumptions_inventory_lot_id_idx";

-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN     "package_size" DECIMAL(15,2) NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

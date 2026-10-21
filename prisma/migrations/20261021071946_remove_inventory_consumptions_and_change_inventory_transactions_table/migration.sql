/*
  Warnings:

  - You are about to drop the `inventory_consumptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventory_consumptions" DROP CONSTRAINT "inventory_consumptions_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_consumptions" DROP CONSTRAINT "inventory_consumptions_order_item_id_fkey";

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "inventory_lot_id" UUID NOT NULL DEFAULT '4cf5dd49-eb63-4a51-b577-e7b2a08923f0',
ADD COLUMN     "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unit_cost" DECIMAL(15,3) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "inventory_consumptions";

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

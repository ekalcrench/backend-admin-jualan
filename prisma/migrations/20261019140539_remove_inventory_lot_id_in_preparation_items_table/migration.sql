/*
  Warnings:

  - You are about to drop the column `source_inventory_lot_id` on the `preparation_items` table. All the data in the column will be lost.
  - You are about to drop the `_InventoryConsumptionToPreparationItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InventoryConsumptionToPreparationItem" DROP CONSTRAINT "_InventoryConsumptionToPreparationItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_InventoryConsumptionToPreparationItem" DROP CONSTRAINT "_InventoryConsumptionToPreparationItem_B_fkey";

-- DropForeignKey
ALTER TABLE "preparation_items" DROP CONSTRAINT "preparation_items_source_inventory_lot_id_fkey";

-- AlterTable
ALTER TABLE "preparation_items" DROP COLUMN "source_inventory_lot_id",
ADD COLUMN     "inventoryLotId" UUID;

-- DropTable
DROP TABLE "_InventoryConsumptionToPreparationItem";

-- AddForeignKey
ALTER TABLE "preparation_items" ADD CONSTRAINT "preparation_items_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

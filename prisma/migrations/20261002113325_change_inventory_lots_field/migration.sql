/*
  Warnings:

  - A unique constraint covering the columns `[purchase_item_id]` on the table `inventory_lots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_purchase_item_id_key" ON "inventory_lots"("purchase_item_id");

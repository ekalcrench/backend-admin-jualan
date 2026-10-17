/*
  Warnings:

  - A unique constraint covering the columns `[preparation_output_id]` on the table `inventory_lots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "preparation_status" AS ENUM ('DRAFT', 'COMPLETED');

-- AlterTable
ALTER TABLE "inventory_lots" ADD COLUMN     "preparation_output_id" UUID;

-- CreateTable
CREATE TABLE "preparations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "status" "preparation_status" NOT NULL DEFAULT 'DRAFT',
    "prepared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "output_inventory_item_id" UUID NOT NULL,
    "output_quantity" DECIMAL(15,2) NOT NULL,
    "output_unit_cost" DECIMAL(15,3) NOT NULL,
    "output_total_cost" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparation_items" (
    "id" UUID NOT NULL,
    "preparation_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "source_inventory_lot_id" UUID NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "unit_cost" DECIMAL(15,3) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "preparation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InventoryConsumptionToPreparationItem" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_InventoryConsumptionToPreparationItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_InventoryTransactionToPreparation" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_InventoryTransactionToPreparation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "preparations_organization_id_prepared_at_idx" ON "preparations"("organization_id", "prepared_at");

-- CreateIndex
CREATE INDEX "preparations_organization_id_status_idx" ON "preparations"("organization_id", "status");

-- CreateIndex
CREATE INDEX "preparation_items_preparation_id_idx" ON "preparation_items"("preparation_id");

-- CreateIndex
CREATE INDEX "preparation_items_source_inventory_lot_id_idx" ON "preparation_items"("source_inventory_lot_id");

-- CreateIndex
CREATE INDEX "_InventoryConsumptionToPreparationItem_B_index" ON "_InventoryConsumptionToPreparationItem"("B");

-- CreateIndex
CREATE INDEX "_InventoryTransactionToPreparation_B_index" ON "_InventoryTransactionToPreparation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_preparation_output_id_key" ON "inventory_lots"("preparation_output_id");

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_preparation_output_id_fkey" FOREIGN KEY ("preparation_output_id") REFERENCES "preparations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparations" ADD CONSTRAINT "preparations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparations" ADD CONSTRAINT "preparations_output_inventory_item_id_fkey" FOREIGN KEY ("output_inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_items" ADD CONSTRAINT "preparation_items_preparation_id_fkey" FOREIGN KEY ("preparation_id") REFERENCES "preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_items" ADD CONSTRAINT "preparation_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_items" ADD CONSTRAINT "preparation_items_source_inventory_lot_id_fkey" FOREIGN KEY ("source_inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryConsumptionToPreparationItem" ADD CONSTRAINT "_InventoryConsumptionToPreparationItem_A_fkey" FOREIGN KEY ("A") REFERENCES "inventory_consumptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryConsumptionToPreparationItem" ADD CONSTRAINT "_InventoryConsumptionToPreparationItem_B_fkey" FOREIGN KEY ("B") REFERENCES "preparation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryTransactionToPreparation" ADD CONSTRAINT "_InventoryTransactionToPreparation_A_fkey" FOREIGN KEY ("A") REFERENCES "inventory_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InventoryTransactionToPreparation" ADD CONSTRAINT "_InventoryTransactionToPreparation_B_fkey" FOREIGN KEY ("B") REFERENCES "preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

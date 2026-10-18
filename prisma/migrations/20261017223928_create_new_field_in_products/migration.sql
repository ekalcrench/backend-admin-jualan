-- DropIndex
DROP INDEX IF EXISTS "preparation_item_lot_consumptions_inventory_lot_id_idx";

-- DropIndex
DROP INDEX "preparation_items_source_inventory_lot_id_idx";

-- DropIndex
DROP INDEX "preparations_organization_id_status_idx";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "yield_percentage" INTEGER NOT NULL DEFAULT 100;

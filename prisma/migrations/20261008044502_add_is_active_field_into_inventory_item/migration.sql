-- DropForeignKey
ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_purchase_item_id_fkey";

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_purchase_item_id_fkey" FOREIGN KEY ("purchase_item_id") REFERENCES "purchase_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

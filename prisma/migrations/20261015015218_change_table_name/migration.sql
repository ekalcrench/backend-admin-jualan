-- AlterTable
ALTER TABLE "purchase_items" RENAME CONSTRAINT "purchase_item_pkey" TO "purchase_items_pkey";

-- AlterTable
ALTER TABLE "purchases" RENAME CONSTRAINT "purchase_pkey" TO "purchases_pkey";

-- RenameForeignKey
ALTER TABLE "purchase_items" RENAME CONSTRAINT "purchase_item_inventory_item_id_fkey" TO "purchase_items_inventory_item_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_items" RENAME CONSTRAINT "purchase_item_purchase_id_fkey" TO "purchase_items_purchase_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchases" RENAME CONSTRAINT "purchase_organization_id_fkey" TO "purchases_organization_id_fkey";

-- RenameIndex
ALTER INDEX "purchase_item_purchase_id_idx" RENAME TO "purchase_items_purchase_id_idx";

-- RenameIndex
ALTER INDEX "purchase_organization_id_supplier_name_invoice_number_key" RENAME TO "purchases_organization_id_supplier_name_invoice_number_key";

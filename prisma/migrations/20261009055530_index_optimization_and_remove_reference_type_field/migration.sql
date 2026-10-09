/*
  Warnings:

  - You are about to drop the column `reference_type` on the `inventory_transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organization_id,user_id]` on the table `organization_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `product_ingredients` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "inventory_items_organization_id_name_key";

-- DropIndex
DROP INDEX "inventory_transactions_inventory_item_id_created_at_idx";

-- DropIndex
DROP INDEX "organization_users_user_id_organization_id_key";

-- DropIndex
DROP INDEX "purchase_item_inventory_item_id_idx";

-- AlterTable
ALTER TABLE "inventory_transactions" DROP COLUMN "reference_type";

-- AlterTable
ALTER TABLE "product_ingredients" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "inventory_items_organization_id_is_active_idx" ON "inventory_items"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "inventory_lots_purchase_item_id_idx" ON "inventory_lots"("purchase_item_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_organization_id_created_at_idx" ON "inventory_transactions"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_organization_id_user_id_key" ON "organization_users"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

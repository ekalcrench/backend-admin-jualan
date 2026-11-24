CREATE TYPE "product_stock_management" AS ENUM ('UNTRACKED', 'MANUAL', 'INVENTORY');

ALTER TABLE "products"
ADD COLUMN "stock_management" "product_stock_management" NOT NULL DEFAULT 'UNTRACKED',
ADD COLUMN "stock" INTEGER;

UPDATE "products"
SET "stock_management" = 'INVENTORY'
WHERE "track_inventory" = true;

ALTER TABLE "products"
DROP COLUMN "track_inventory";

ALTER TABLE "order_items"
ADD COLUMN "manual_stock_deducted" BOOLEAN NOT NULL DEFAULT false;

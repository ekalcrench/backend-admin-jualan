-- CreateEnum
CREATE TYPE "costing_status" AS ENUM ('UNKNOWN', 'CALCULATED');

-- AlterTable
ALTER TABLE "order_items"
ADD COLUMN "costing_status" "costing_status" NOT NULL DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "order_item_modifiers"
ADD COLUMN "track_inventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inventory_policy" "inventory_policy" NOT NULL DEFAULT 'STRICT';

-- AlterTable
ALTER TABLE "orders"
ADD COLUMN "inventory_deducted" BOOLEAN NOT NULL DEFAULT false;

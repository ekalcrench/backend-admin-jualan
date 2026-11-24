-- CreateEnum
CREATE TYPE "inventory_policy" AS ENUM ('STRICT', 'ALLOW_NEGATIVE');

-- AlterTable
ALTER TABLE "product_modifier_options" ADD COLUMN     "inventory_policy" "inventory_policy" NOT NULL DEFAULT 'STRICT',
ADD COLUMN     "track_inventory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "inventory_policy" "inventory_policy" NOT NULL DEFAULT 'STRICT',
ADD COLUMN     "track_inventory" BOOLEAN NOT NULL DEFAULT false;

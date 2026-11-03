-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_lot_id" SET DEFAULT '4cf5dd49-eb63-4a51-b577-e7b2a08923f0';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "total_quantity" INTEGER NOT NULL DEFAULT 0;

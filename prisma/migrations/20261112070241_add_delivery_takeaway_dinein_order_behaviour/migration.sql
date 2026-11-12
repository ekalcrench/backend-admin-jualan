-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('DELIVERY', 'TAKEAWAY', 'DINE_IN');

-- CreateEnum
CREATE TYPE "table_status" AS ENUM ('AVAILABLE', 'OCCUPIED');

-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_lot_id" SET DEFAULT '4cf5dd49-eb63-4a51-b577-e7b2a08923f0';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cashier_id" UUID,
ADD COLUMN     "customer_id" UUID,
ADD COLUMN     "reference_id" UUID NOT NULL DEFAULT 'bd2cee73-32e2-4a0f-ac38-b21c9b2ee8b4',
ADD COLUMN     "type" "order_type" NOT NULL DEFAULT 'DELIVERY';

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" UUID NOT NULL,
    "delivery_fee" DECIMAL(15,2) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(16) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dine_in_orders" (
    "id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "name" TEXT,
    "guest_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "dine_in_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "table_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "status" "table_status" NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takeaway_orders" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(16),
    "pick_up_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "takeaway_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tables_organization_id_idx" ON "tables"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "tables_organization_id_table_number_key" ON "tables"("organization_id", "table_number");

-- AddForeignKey
ALTER TABLE "dine_in_orders" ADD CONSTRAINT "dine_in_orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

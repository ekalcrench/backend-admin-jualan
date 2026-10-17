-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PAID', 'UNPAID');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "status" "order_status" NOT NULL DEFAULT 'UNPAID';

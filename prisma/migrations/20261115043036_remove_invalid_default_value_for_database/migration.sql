-- AlterTable
ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_lot_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "address" DROP DEFAULT,
ALTER COLUMN "email" DROP DEFAULT,
ALTER COLUMN "phone" DROP DEFAULT,
ALTER COLUMN "logo_base64" DROP DEFAULT;

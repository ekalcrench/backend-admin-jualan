/*
  Warnings:

  - The values [PREPARATION] on the enum `inventory_transaction_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "inventory_transaction_type_new" AS ENUM ('PURCHASE', 'SALE', 'PREPARATION_IN', 'PREPARATION_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'WASTE', 'RETURN');
ALTER TABLE "inventory_transactions" ALTER COLUMN "type" TYPE "inventory_transaction_type_new" USING ("type"::text::"inventory_transaction_type_new");
ALTER TYPE "inventory_transaction_type" RENAME TO "inventory_transaction_type_old";
ALTER TYPE "inventory_transaction_type_new" RENAME TO "inventory_transaction_type";
DROP TYPE "public"."inventory_transaction_type_old";
COMMIT;

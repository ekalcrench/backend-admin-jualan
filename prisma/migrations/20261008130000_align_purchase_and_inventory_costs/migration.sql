-- The previous migration renamed the stored unit costs to total_cost.
-- Restore unit_cost and derive line totals for the existing records.
ALTER TABLE "purchase_item"
  ALTER COLUMN "total_cost" TYPE DECIMAL(15, 2)
  USING ("total_cost" * "quantity")::DECIMAL(15, 2);

ALTER TABLE "inventory_lots"
  ADD COLUMN "unit_cost" DECIMAL(15, 3);

UPDATE "inventory_lots"
SET
  "unit_cost" = "total_cost"::DECIMAL(15, 3),
  "total_cost" = ("total_cost" * "quantity")::DECIMAL(15, 2);

ALTER TABLE "inventory_lots"
  ALTER COLUMN "unit_cost" SET NOT NULL,
  ALTER COLUMN "total_cost" TYPE DECIMAL(15, 2)
    USING "total_cost"::DECIMAL(15, 2);

ALTER TABLE "inventory_consumptions"
  RENAME COLUMN "cost_per_unit" TO "unit_cost";

ALTER TABLE "inventory_consumptions"
  ALTER COLUMN "unit_cost" TYPE DECIMAL(15, 3)
    USING "unit_cost"::DECIMAL(15, 3),
  ALTER COLUMN "total_cost" TYPE DECIMAL(15, 2)
    USING "total_cost"::DECIMAL(15, 2);
ALTER TABLE "purchase_item"
  RENAME COLUMN "unit_cost" TO "total_cost";

ALTER TABLE "purchase_item"
  ALTER COLUMN "total_cost" TYPE DOUBLE PRECISION
  USING "total_cost"::DOUBLE PRECISION;

ALTER TABLE "inventory_lots"
  RENAME COLUMN "unit_cost" TO "total_cost";

ALTER TABLE "inventory_lots"
  ALTER COLUMN "total_cost" TYPE DOUBLE PRECISION
  USING "total_cost"::DOUBLE PRECISION;

ALTER TABLE "inventory_consumptions"
  RENAME COLUMN "unit_cost" TO "cost_per_unit";

ALTER TABLE "inventory_consumptions"
  ALTER COLUMN "cost_per_unit" TYPE DOUBLE PRECISION
  USING "cost_per_unit"::DOUBLE PRECISION;

ALTER TABLE "inventory_consumptions"
  ALTER COLUMN "total_cost" TYPE DOUBLE PRECISION
  USING "total_cost"::DOUBLE PRECISION;
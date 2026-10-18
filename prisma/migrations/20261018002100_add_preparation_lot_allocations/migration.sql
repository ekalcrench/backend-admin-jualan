-- Preparation output lots are not associated with a purchase item.
ALTER TABLE "inventory_lots"
ALTER COLUMN "purchase_item_id" DROP NOT NULL;

CREATE TABLE "preparation_item_lot_consumptions" (
    "id" UUID NOT NULL,
    "preparation_item_id" UUID NOT NULL,
    "inventory_lot_id" UUID NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "unit_cost" DECIMAL(15,3) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "preparation_item_lot_consumptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "preparation_item_lot_consumptions_preparation_item_id_idx"
ON "preparation_item_lot_consumptions"("preparation_item_id");

CREATE INDEX "preparation_item_lot_consumptions_inventory_lot_id_idx"
ON "preparation_item_lot_consumptions"("inventory_lot_id");

ALTER TABLE "preparation_item_lot_consumptions"
ADD CONSTRAINT "preparation_item_lot_consumptions_preparation_item_id_fkey"
FOREIGN KEY ("preparation_item_id") REFERENCES "preparation_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "preparation_item_lot_consumptions"
ADD CONSTRAINT "preparation_item_lot_consumptions_inventory_lot_id_fkey"
FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

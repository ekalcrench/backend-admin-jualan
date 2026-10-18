ALTER TABLE "purchase_items"
ADD COLUMN "received_at" TIMESTAMP(3),
ADD COLUMN "expired_at" TIMESTAMP(3);

UPDATE "purchase_items" AS purchase_item
SET
  "received_at" = COALESCE(
    (
      SELECT inventory_lot."received_at"
      FROM "inventory_lots" AS inventory_lot
      WHERE inventory_lot."purchase_item_id" = purchase_item."id"
    ),
    (
      SELECT purchase."purchased_at"
      FROM "purchases" AS purchase
      WHERE purchase."id" = purchase_item."purchase_id"
    )
  ),
  "expired_at" = (
    SELECT inventory_lot."expired_at"
    FROM "inventory_lots" AS inventory_lot
    WHERE inventory_lot."purchase_item_id" = purchase_item."id"
  );

ALTER TABLE "purchase_items"
ALTER COLUMN "received_at" SET NOT NULL;

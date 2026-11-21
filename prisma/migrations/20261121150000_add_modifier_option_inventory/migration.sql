-- AlterTable
ALTER TABLE "product_modifier_options"
    ADD COLUMN "inventory_item_id" UUID,
    ADD COLUMN "inventory_quantity" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "order_item_modifiers"
    ADD COLUMN "inventory_item_id" UUID,
    ADD COLUMN "inventory_quantity" DECIMAL(15,2);

-- CreateIndex
CREATE INDEX "product_modifier_options_inventory_item_id_idx" ON "product_modifier_options"("inventory_item_id");

-- CreateIndex
CREATE INDEX "order_item_modifiers_inventory_item_id_idx" ON "order_item_modifiers"("inventory_item_id");

-- AddForeignKey
-- Restrict keeps an inventory item referenced by a modifier option from being
-- physically deleted. The inventory item service already falls back to a soft
-- delete (is_active = false) when a delete is rejected.
ALTER TABLE "product_modifier_options" ADD CONSTRAINT "product_modifier_options_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Defense-in-depth integrity rules that Prisma does not model as check
-- constraints. The DTO and service layers validate these first; these
-- constraints protect the data if a future code path writes directly.
ALTER TABLE "product_modifier_options"
    ADD CONSTRAINT "product_modifier_options_inventory_configuration_check"
    CHECK (
        ("inventory_item_id" IS NULL AND "inventory_quantity" IS NULL)
        OR (
            "inventory_item_id" IS NOT NULL
            AND "inventory_quantity" IS NOT NULL
            AND "inventory_quantity" > 0
        )
    );

ALTER TABLE "order_item_modifiers"
    ADD CONSTRAINT "order_item_modifiers_inventory_configuration_check"
    CHECK (
        ("inventory_item_id" IS NULL AND "inventory_quantity" IS NULL)
        OR (
            "inventory_item_id" IS NOT NULL
            AND "inventory_quantity" IS NOT NULL
            AND "inventory_quantity" > 0
        )
    );

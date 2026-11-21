-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "modifier_group_id" UUID,
    "modifier_option_id" UUID,
    "group_name" VARCHAR(255) NOT NULL,
    "option_name" VARCHAR(255) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_item_modifiers_order_item_id_idx" ON "order_item_modifiers"("order_item_id");

-- CreateIndex
CREATE INDEX "order_item_modifiers_modifier_group_id_idx" ON "order_item_modifiers"("modifier_group_id");

-- CreateIndex
CREATE INDEX "order_item_modifiers_modifier_option_id_idx" ON "order_item_modifiers"("modifier_option_id");

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "product_modifier_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_option_id_fkey" FOREIGN KEY ("modifier_option_id") REFERENCES "product_modifier_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

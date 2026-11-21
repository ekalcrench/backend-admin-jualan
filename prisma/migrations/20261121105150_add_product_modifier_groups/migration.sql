-- CreateTable
CREATE TABLE "product_modifier_groups" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_selection" INTEGER NOT NULL DEFAULT 0,
    "max_selection" INTEGER NOT NULL DEFAULT 1,
    "is_multiple" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_modifier_group_mappings" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_modifier_group_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_modifier_options" (
    "id" UUID NOT NULL,
    "modifier_group_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_modifier_groups_organization_id_is_active_sort_orde_idx" ON "product_modifier_groups"("organization_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_groups_organization_id_name_key" ON "product_modifier_groups"("organization_id", "name");

-- CreateIndex
CREATE INDEX "product_modifier_group_mappings_product_id_sort_order_idx" ON "product_modifier_group_mappings"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "product_modifier_group_mappings_modifier_group_id_idx" ON "product_modifier_group_mappings"("modifier_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_group_mappings_product_id_modifier_group_i_key" ON "product_modifier_group_mappings"("product_id", "modifier_group_id");

-- CreateIndex
CREATE INDEX "product_modifier_options_modifier_group_id_is_active_sort_o_idx" ON "product_modifier_options"("modifier_group_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_options_modifier_group_id_name_key" ON "product_modifier_options"("modifier_group_id", "name");

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_group_mappings" ADD CONSTRAINT "product_modifier_group_mappings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_group_mappings" ADD CONSTRAINT "product_modifier_group_mappings_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "product_modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_options" ADD CONSTRAINT "product_modifier_options_modifier_group_id_fkey" FOREIGN KEY ("modifier_group_id") REFERENCES "product_modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defense-in-depth integrity rules that Prisma does not model as check constraints.
-- The service and DTO layers validate these first; these constraints protect the data
-- if a future code path writes modifiers directly.
ALTER TABLE "product_modifier_groups"
    ADD CONSTRAINT "product_modifier_groups_min_selection_check" CHECK ("min_selection" >= 0),
    ADD CONSTRAINT "product_modifier_groups_max_selection_check" CHECK ("max_selection" >= "min_selection"),
    ADD CONSTRAINT "product_modifier_groups_required_min_check" CHECK (NOT "is_required" OR "min_selection" >= 1),
    ADD CONSTRAINT "product_modifier_groups_single_max_check" CHECK ("is_multiple" OR "max_selection" <= 1);

ALTER TABLE "product_modifier_options"
    ADD CONSTRAINT "product_modifier_options_price_check" CHECK ("price" >= 0);

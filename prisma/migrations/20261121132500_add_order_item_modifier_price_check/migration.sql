-- Defense-in-depth integrity rule for the historical modifier price snapshot.
ALTER TABLE "order_item_modifiers"
    ADD CONSTRAINT "order_item_modifiers_unit_price_check" CHECK ("unit_price" >= 0);

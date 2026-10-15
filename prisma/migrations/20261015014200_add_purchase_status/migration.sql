ALTER TABLE "purchase" RENAME TO "purchases";
ALTER TABLE "purchase_item" RENAME TO "purchase_items";

CREATE TYPE "purchase_status" AS ENUM ('DRAFT', 'FINALIZED');

ALTER TABLE "purchases"
ADD COLUMN "status" "purchase_status" NOT NULL DEFAULT 'DRAFT';
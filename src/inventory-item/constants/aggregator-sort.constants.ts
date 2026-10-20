import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const inventoryItemAggregateSort = {
  totalStock: Prisma.sql`COALESCE(SUM(lot.remaining_quantity), 0)`,
  totalCost: Prisma.sql`COALESCE(SUM(lot.unit_cost * lot.remaining_quantity), 0)`,
  averageCost: Prisma.sql`CASE
    WHEN COALESCE(SUM(lot.remaining_quantity), 0) = 0 THEN 0
    ELSE SUM(lot.unit_cost * lot.remaining_quantity) / SUM(lot.remaining_quantity)
  END`,
};

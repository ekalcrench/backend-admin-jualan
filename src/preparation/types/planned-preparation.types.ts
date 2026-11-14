import { Prisma } from '../../../prisma/generated/prisma/client.js';
import type { PlannedItem } from './planned-item.types.js';

export type PlannedPreparation = {
  items: PlannedItem[];
  inventoryTransactions: Array<{
    inventoryItemId: string;
    inventoryLotId: string;
    quantity: Prisma.Decimal;
    unitCost: Prisma.Decimal;
    totalCost: Prisma.Decimal;
  }>;
};

import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type PlannedItem = {
  id?: string;
  inventoryItemId: string;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
};

import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type PlannedAllocation = {
  inventoryLotId: string;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
};

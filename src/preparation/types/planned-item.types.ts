import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { PlannedAllocation } from './planned-allocation.types.js';

export type PlannedItem = {
  id?: string;
  inventoryItemId: string;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  allocations: PlannedAllocation[];
};

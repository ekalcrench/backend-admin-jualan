import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const inventoryLotSortMap: Record<
  string,
  Prisma.InventoryLotOrderByWithRelationInput
> = {
  quantity: { quantity: 'asc' },
  '-quantity': { quantity: 'desc' },
  remainingQuantity: { remainingQuantity: 'asc' },
  '-remainingQuantity': { remainingQuantity: 'desc' },
  unitCost: { unitCost: 'asc' },
  '-unitCost': { unitCost: 'desc' },
  totalCost: { totalCost: 'asc' },
  '-totalCost': { totalCost: 'desc' },
  receivedAt: { receivedAt: 'asc' },
  '-receivedAt': { receivedAt: 'desc' },
  createdAt: { createdAt: 'asc' },
  '-createdAt': { createdAt: 'desc' },
  expiredAt: { expiredAt: 'asc' },
  '-expiredAt': { expiredAt: 'desc' },
};

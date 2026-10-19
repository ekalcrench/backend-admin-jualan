import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sortMap: Record<
  string,
  Prisma.InventoryTransactionOrderByWithRelationInput
> = {
  quantity: { quantity: 'asc' },
  '-quantity': { quantity: 'desc' },
  type: { type: 'asc' },
  '-type': { type: 'desc' },
  createdAt: { createdAt: 'asc' },
  '-createdAt': { createdAt: 'desc' },
};

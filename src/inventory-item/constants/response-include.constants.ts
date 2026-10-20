import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const itemWithLots = {
  lots: {
    orderBy: { receivedAt: 'asc' },
    select: {
      remainingQuantity: true,
      unitCost: true,
    },
  },
} satisfies Prisma.InventoryItemInclude;

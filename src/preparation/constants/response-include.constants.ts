import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const preparationInclude = {
  outputInventoryItem: { select: { id: true, name: true, unit: true } },
  items: {
    orderBy: { id: 'asc' },
    include: {
      inventoryItem: { select: { id: true, name: true, unit: true } },
      allocations: { orderBy: { id: 'asc' } },
    },
  },
} satisfies Prisma.PreparationInclude;

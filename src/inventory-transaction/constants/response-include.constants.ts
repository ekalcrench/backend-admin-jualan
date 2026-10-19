import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const responseInclude = {
  inventoryItem: {
    select: { name: true, unit: true },
  },
} satisfies Prisma.InventoryTransactionInclude;

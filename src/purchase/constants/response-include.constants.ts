import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const responseInclude = {
  purchaseItems: {
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
      inventoryLot: true,
    },
  },
} satisfies Prisma.PurchaseInclude;

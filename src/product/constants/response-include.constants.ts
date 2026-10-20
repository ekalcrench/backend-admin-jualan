import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const productInclude = {
  productIngredients: {
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          unit: true,
          lots: {
            orderBy: { receivedAt: 'asc' },
            take: 1,
            select: { unitCost: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProductInclude;

import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const responseInclude = {
  cashier: {
    select: { name: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true },
      },
      modifiers: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.OrderInclude;

import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const responseInclude = {
  items: {
    include: {
      product: {
        select: { id: true, name: true },
      },
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.OrderInclude;

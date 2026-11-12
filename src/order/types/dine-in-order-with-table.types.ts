import { Prisma } from '../../../prisma/generated/prisma/client.js';

export type DineInOrderWithTable = Prisma.DineInOrderGetPayload<{
  include: {
    table: {
      select: {
        id: true;
        tableNumber: true;
        name: true;
        capacity: true;
        status: true;
      };
    };
  };
}>;
